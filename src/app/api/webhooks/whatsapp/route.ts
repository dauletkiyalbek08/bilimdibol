import { NextResponse } from "next/server";
import { ingestLead } from "@/lib/server/lead-intake";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "bilimdibol-demo-verify-token";

async function logEvent(type: string, payload: unknown, status: "ok" | "failed" | "pending") {
  try {
    const admin = getSupabaseAdmin();
    await admin?.from("integration_events").insert({
      channel: "whatsapp",
      type,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload).slice(0, 1500),
      status,
    });
  } catch {
    /* ignore */
  }
}

// WhatsApp Cloud API использует Meta-стиль GET-верификации.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (
    searchParams.get("hub.mode") === "subscribe" &&
    searchParams.get("hub.verify_token") === VERIFY_TOKEN
  ) {
    return new NextResponse(searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface WaMessage {
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } };
  referral?: { source_id?: string; source_type?: string; headline?: string; body?: string; source_url?: string };
}
interface WaContact {
  profile?: { name?: string };
  wa_id?: string;
}

function messageText(m: WaMessage): string {
  return (
    m.text?.body ||
    m.button?.text ||
    m.interactive?.list_reply?.title ||
    m.interactive?.button_reply?.title ||
    ""
  );
}

// Входящие WhatsApp (в т.ч. из Click-to-WhatsApp рекламы) → лид в CRM.
export async function POST(req: Request) {
  let body: {
    entry?: {
      changes?: {
        field?: string;
        value?: {
          messages?: WaMessage[];
          contacts?: WaContact[];
          statuses?: unknown[];
        };
      }[];
    }[];
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  await logEvent("post_received", body, "pending");

  let created = 0;
  for (const entry of body.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      if (ch.field !== "messages") continue;
      const val = ch.value;
      if (!val?.messages?.length) continue; // statuses (доставка/прочтение) — пропускаем

      const contactName = val.contacts?.[0]?.profile?.name || "";

      for (const m of val.messages) {
        const phone = m.from || val.contacts?.[0]?.wa_id || "";
        if (!phone) continue;
        const text = messageText(m);
        const ref = m.referral;
        const fromAd = ref?.source_type === "ad" || !!ref?.source_id;
        try {
          const result = await ingestLead({
            name: contactName || "WhatsApp-гость",
            phone,
            source: fromAd ? "WhatsApp (реклама)" : "WhatsApp",
            comment:
              (text ? `Сообщение: ${text}` : "Написал в WhatsApp") +
              (ref?.headline ? ` · из объявления «${ref.headline}»` : ""),
            utmCampaign: ref?.headline || "",
            creativeId: ref?.source_id || "",
          });
          await logEvent(
            "lead_processed",
            { phone, name: contactName, text, fromAd, result },
            result.ok ? "ok" : "failed",
          );
          if (result.ok && !result.deduped) created++;
        } catch (e) {
          await logEvent("exception", String(e), "failed");
        }
      }
    }
  }

  // Meta ждёт быстрый 200, иначе ретраи.
  return NextResponse.json({ received: true, created });
}
