import { NextResponse } from "next/server";
import { ingestLead } from "@/lib/server/lead-intake";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function logEvent(type: string, payload: unknown, status: "ok" | "failed" | "pending") {
  try {
    const admin = getSupabaseAdmin();
    await admin?.from("integration_events").insert({
      channel: "meta",
      type,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload).slice(0, 1500),
      status,
    });
  } catch {
    /* ignore */
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token";
const GRAPH = "https://graph.facebook.com/v21.0";

// Верификация webhook (Meta дёргает GET при подключении).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface FieldDatum {
  name: string;
  values: string[];
}

function fieldVal(fields: FieldDatum[], keys: string[]): string {
  for (const k of keys) {
    const f = fields.find((x) => x.name?.toLowerCase() === k.toLowerCase());
    if (f?.values?.[0]) return f.values[0];
  }
  return "";
}

// Извлечение полей с учётом локализованных названий (рус/каз) и по содержимому.
function extractName(fields: FieldDatum[]): string {
  const byKey = fieldVal(fields, [
    "full_name", "name", "имя", "имя_и_фамилия", "полное_имя", "фио",
    "аты", "толық_аты", "толык_аты", "аты_жөні", "аты-жөні",
  ]);
  if (byKey) return byKey;
  const f = fields.find((x) => /(имя|name|аты|фио|жөн|fname)/i.test(x.name || ""));
  return f?.values?.[0] || "";
}

function extractPhone(fields: FieldDatum[]): string {
  const byKey = fieldVal(fields, [
    "phone_number", "phone", "телефон", "номер_телефона", "номер", "нөмір", "тел", "telefon", "whatsapp",
  ]);
  if (byKey) return byKey;
  const f = fields.find((x) => {
    const v = x.values?.[0]?.trim() || "";
    return /^\+?\d[\d\s()\-]{6,}$/.test(v);
  });
  return f?.values?.[0] || "";
}

function extractEmail(fields: FieldDatum[]): string {
  const byKey = fieldVal(fields, ["email", "почта", "e-mail", "эл_почта", "электронная_почта"]);
  if (byKey) return byKey;
  const f = fields.find((x) => (x.values?.[0] || "").includes("@"));
  return f?.values?.[0] || "";
}

// Входящие события Meta (Lead Ads → leadgen). Тянем данные лида через Graph API
// и создаём лид в CRM той же логикой, что и формы (назначение, сделка, Telegram).
export async function POST(req: Request) {
  let body: {
    entry?: { changes?: { field?: string; value?: { leadgen_id?: string; form_id?: string; ad_id?: string } }[] }[];
  } = {};
  try {
    body = await req.json();
  } catch {
    await logEvent("post_invalid_json", "", "failed");
    return NextResponse.json({ received: true });
  }

  await logEvent("post_received", body, "pending");

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const leadgenEvents = (body.entry ?? [])
    .flatMap((e) => e.changes ?? [])
    .filter((c) => c.field === "leadgen" && c.value?.leadgen_id);

  if (leadgenEvents.length === 0) {
    await logEvent("no_leadgen_events", body, "failed");
    return NextResponse.json({ received: true, note: "no leadgen events" });
  }
  if (!token) {
    await logEvent("no_token", "", "failed");
    return NextResponse.json({ received: true, mode: "mock", note: "META_PAGE_ACCESS_TOKEN не задан" });
  }

  let created = 0;
  for (const ev of leadgenEvents) {
    const leadgenId = ev.value!.leadgen_id!;
    try {
      const res = await fetch(`${GRAPH}/${leadgenId}?fields=field_data,created_time&access_token=${token}`);
      const raw = await res.text();
      if (!res.ok) {
        await logEvent("graph_fetch_failed", `id=${leadgenId} status=${res.status} ${raw}`, "failed");
        continue;
      }
      const lead = JSON.parse(raw) as { field_data?: FieldDatum[] };
      const fields = lead.field_data ?? [];
      const name = extractName(fields);
      const phone = extractPhone(fields);
      const email = extractEmail(fields);
      const result = await ingestLead({
        name,
        phone,
        email,
        source: "Instagram",
        comment: "Заявка из Meta Lead Ads",
        utmCampaign: ev.value?.form_id || "",
        creativeId: ev.value?.ad_id || "",
      });
      await logEvent(
        "lead_processed",
        { fields, name, phone, email, result },
        result.ok ? "ok" : "failed",
      );
      if (result.ok && !result.deduped) created++;
    } catch (e) {
      await logEvent("exception", String(e), "failed");
    }
  }

  return NextResponse.json({ received: true, mode: "live", created });
}
