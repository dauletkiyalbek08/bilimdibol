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

    // ---- Пул хантеров из БД (роль hunter, только активные), фолбэк на mock
    let hunters: { id: string; name: string }[] = [];
    const withActive = await admin.from("users").select("id, name, active").eq("role", "hunter");
    if (!withActive.error && withActive.data) {
      hunters = withActive.data
        .filter((h) => (h as { active?: boolean }).active !== false)
        .map((h) => ({ id: h.id as string, name: h.name as string }));
    } else {
      // колонки active ещё нет (миграция не применена)
      const noActive = await admin.from("users").select("id, name").eq("role", "hunter");
      hunters = (noActive.data ?? []).map((h) => ({ id: h.id as string, name: h.name as string }));
    }
    if (hunters.length === 0) hunters = HUNTERS.map((h) => ({ id: h.id, name: h.name }));

    // ---- Assignment: only hunters present today, balanced by current load
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: att } = await admin
      .from("attendance")
      .select("employee_id, status, date, check_out")
      .gte("date", todayStart.toISOString());
    // Присутствует = отметился сегодня (Вовремя/Опоздал/Удалённо) И ещё НЕ ушёл (check_out пуст)
    const presentIds = new Set(
      (att ?? [])
        .filter(
          (a) =>
            ["on_time", "late", "remote"].includes(a.status as string) &&
            !(a as { check_out: string | null }).check_out,
        )
        .map((a) => a.employee_id as string),
    );
    let candidates = hunters.filter((h) => presentIds.has(h.id));
    if (candidates.length === 0) candidates = hunters; // никого нет на смене → всем по кругу

    // least-loaded among candidates — по СЕГОДНЯШНИМ лидам
    const { data: leadRows } = await admin
      .from("leads")
      .select("hunter_id")
      .gte("created_at", todayStart.toISOString());
    const load = new Map<string, number>();
    for (const l of leadRows ?? []) {
      const hid = (l as { hunter_id: string | null }).hunter_id;
      if (hid) load.set(hid, (load.get(hid) ?? 0) + 1);
    }
    candidates = [...candidates].sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
    const hunter = candidates[0];
    const noneOnShift = presentIds.size === 0 || !hunters.some((h) => presentIds.has(h.id));

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
        `🎯 Hunter: ${hunter.name}${noneOnShift ? " ⚠️ (никто не на смене — назначен по кругу)" : ""}\n\n` +
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
