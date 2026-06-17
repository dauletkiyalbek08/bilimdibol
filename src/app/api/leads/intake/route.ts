import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { HUNTERS } from "@/lib/mock-data";
import { notifyTelegram } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public lead intake — used by our own landing form AND external sources
// (Tilda webhook, custom HTML forms). Inserts via service_role so submitters
// don't need to be authenticated, and auto-assigns to a hunter round-robin.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

function pick(obj: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase());
    if (found && obj[found]?.trim()) return obj[found].trim();
  }
  return "";
}

export async function POST(req: Request) {
  // Parse JSON or form-encoded payloads (Tilda sends form data)
  let payload: Record<string, string> = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      fd.forEach((v, k) => {
        payload[k] = String(v);
      });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400, headers: cors });
  }

  const name = pick(payload, ["name", "Name", "fname", "имя", "client_name"]);
  const phone = pick(payload, ["phone", "Phone", "tel", "телефон", "phone_number"]);
  const email = pick(payload, ["email", "Email", "почта"]);
  const comment = pick(payload, ["comment", "message", "Comment", "комментарий", "text"]);
  const source = pick(payload, ["source", "utm_source", "Source"]) || "Landing Page";
  const utm_campaign = pick(payload, ["utm_campaign", "campaign"]);
  const creative_id = pick(payload, ["creative_id", "utm_content", "ad_id"]);
  const instagram = pick(payload, ["instagram", "ig"]);

  if (!name && !phone) {
    return NextResponse.json({ ok: false, error: "name or phone required" }, { status: 400, headers: cors });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    // Demo / no Supabase configured — acknowledge without persisting.
    return NextResponse.json(
      { ok: true, mode: "mock", note: "Supabase не настроен — лид не сохранён (демо)" },
      { headers: cors },
    );
  }

  try {
    // ---- Dedup by phone (last 10 digits) — repeat ad clicks won't create duplicates
    const incomingDigits = phone.replace(/\D/g, "");
    if (incomingDigits.length >= 6) {
      const { data: existing } = await admin.from("leads").select("id, phone, comment").limit(3000);
      const tail = incomingDigits.slice(-10);
      const dup = (existing ?? []).find(
        (l) => (l.phone || "").replace(/\D/g, "").slice(-10) === tail,
      );
      if (dup) {
        const note = `${dup.comment ?? ""} · повторная заявка (${source}, ${new Date().toLocaleDateString("ru-RU")})`.trim();
        await admin.from("leads").update({ comment: note }).eq("id", dup.id);
        return NextResponse.json(
          { ok: true, mode: "live", deduped: true, id: dup.id },
          { headers: cors },
        );
      }
    }

    // Round-robin assignment by current lead count
    const { count } = await admin.from("leads").select("id", { count: "exact", head: true });
    const hunter = HUNTERS[(count ?? 0) % HUNTERS.length];

    const { data, error } = await admin
      .from("leads")
      .insert({
        name: name || "Без имени",
        phone,
        email: email || null,
        instagram: instagram || null,
        source,
        comment,
        utm_campaign: utm_campaign || null,
        creative_id: creative_id || null,
        hunter_id: hunter.id,
        status: "new",
      })
      .select("id")
      .single();

    if (error) throw error;

    // Auto-create a deal in the CRM pipeline (stage "new"), linked to the lead
    let dealCreated = false;
    try {
      const { error: dealErr } = await admin.from("deals").insert({
        lead_id: data?.id ?? null,
        client_name: name || "Без имени",
        phone,
        source,
        amount: 0,
        hunter_id: hunter.id,
        stage: "new",
        next_step: "Связаться и квалифицировать",
        quality: "warm",
        probability: 10,
        comment,
        utm_campaign: utm_campaign || null,
        creative_id: creative_id || null,
      });
      dealCreated = !dealErr;
    } catch {
      /* lead is saved; deal is best-effort */
    }

    // Instant Telegram notification (best-effort, no-op if not configured)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bilimdibol.vercel.app";
    await notifyTelegram(
      `🔔 <b>Новый лид</b>\n` +
        `👤 ${name || "Без имени"}\n` +
        `📞 ${phone || "—"}\n` +
        `📍 Источник: ${source}\n` +
        (comment ? `💬 ${comment}\n` : "") +
        `🎯 Hunter: ${hunter.name}\n\n` +
        `➡️ ${appUrl}/leads`,
    );

    return NextResponse.json(
      { ok: true, mode: "live", id: data?.id, assignedTo: hunter.name, dealCreated },
      { headers: cors },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "insert failed" },
      { status: 500, headers: cors },
    );
  }
}
