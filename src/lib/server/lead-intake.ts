// Общая серверная логика приёма лида: дедуп → назначение хантеру (присутствие
// + нагрузка) → создание лида и сделки → Telegram. Используется и нашим
// приёмником (/api/leads/intake), и Meta-вебхуком (/api/webhooks/meta).
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { HUNTERS } from "@/lib/mock-data";
import { notifyTelegram } from "@/lib/notify/telegram";

export interface IngestInput {
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  source: string;
  comment?: string;
  utmCampaign?: string;
  creativeId?: string;
}

export interface IngestResult {
  ok: boolean;
  mode?: "live" | "mock";
  id?: string;
  assignedTo?: string;
  dealCreated?: boolean;
  deduped?: boolean;
  error?: string;
}

export async function ingestLead(input: IngestInput): Promise<IngestResult> {
  const name = input.name?.trim() || "Без имени";
  const phone = input.phone?.trim() || "";
  const email = input.email?.trim() || "";
  const comment = input.comment?.trim() || "";
  const source = input.source?.trim() || "Landing Page";
  const utmCampaign = input.utmCampaign?.trim() || "";
  const creativeId = input.creativeId?.trim() || "";
  const instagram = input.instagram?.trim() || "";

  if (!name && !phone) return { ok: false, error: "name or phone required" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, mode: "mock" };

  // ---- Dedup by phone (last 10 digits)
  const incomingDigits = phone.replace(/\D/g, "");
  if (incomingDigits.length >= 6) {
    const { data: existing } = await admin.from("leads").select("id, phone, comment").limit(3000);
    const tail = incomingDigits.slice(-10);
    const dup = (existing ?? []).find((l) => (l.phone || "").replace(/\D/g, "").slice(-10) === tail);
    if (dup) {
      const note = `${dup.comment ?? ""} · повторная заявка (${source}, ${new Date().toLocaleDateString("ru-RU")})`.trim();
      await admin.from("leads").update({ comment: note }).eq("id", dup.id);
      return { ok: true, mode: "live", deduped: true, id: dup.id as string };
    }
  }

  // ---- Пул хантеров из БД (активные), фолбэк на mock
  let hunters: { id: string; name: string }[] = [];
  const withActive = await admin.from("users").select("id, name, active").eq("role", "hunter");
  if (!withActive.error && withActive.data) {
    hunters = withActive.data
      .filter((h) => (h as { active?: boolean }).active !== false)
      .map((h) => ({ id: h.id as string, name: h.name as string }));
  } else {
    const noActive = await admin.from("users").select("id, name").eq("role", "hunter");
    hunters = (noActive.data ?? []).map((h) => ({ id: h.id as string, name: h.name as string }));
  }
  if (hunters.length === 0) hunters = HUNTERS.map((h) => ({ id: h.id, name: h.name }));

  // ---- Назначение: только присутствующие сегодня, по наименьшей нагрузке за день
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: att } = await admin
    .from("attendance")
    .select("employee_id, status, date, check_out")
    .gte("date", todayStart.toISOString());
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
  if (candidates.length === 0) candidates = hunters;

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

  // ---- Создаём лид
  const { data, error } = await admin
    .from("leads")
    .insert({
      name,
      phone,
      email: email || null,
      instagram: instagram || null,
      source,
      comment,
      utm_campaign: utmCampaign || null,
      creative_id: creativeId || null,
      hunter_id: hunter.id,
      status: "new",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // ---- Сделка в воронке
  let dealCreated = false;
  try {
    const { error: dealErr } = await admin.from("deals").insert({
      lead_id: data?.id ?? null,
      client_name: name,
      phone,
      source,
      amount: 0,
      hunter_id: hunter.id,
      stage: "new",
      next_step: "Связаться и квалифицировать",
      quality: "warm",
      probability: 10,
      comment,
      utm_campaign: utmCampaign || null,
      creative_id: creativeId || null,
    });
    dealCreated = !dealErr;
  } catch {
    /* best-effort */
  }

  // ---- Telegram
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bilimdibol.vercel.app";
  await notifyTelegram(
    `🔔 <b>Новый лид</b>\n` +
      `👤 ${name}\n` +
      `📞 ${phone || "—"}\n` +
      `📍 Источник: ${source}\n` +
      (comment ? `💬 ${comment}\n` : "") +
      `🎯 Hunter: ${hunter.name}${noneOnShift ? " ⚠️ (никто не на смене — назначен по кругу)" : ""}\n\n` +
      `➡️ ${appUrl}/leads`,
  );

  return { ok: true, mode: "live", id: data?.id as string, assignedTo: hunter.name, dealCreated };
}
