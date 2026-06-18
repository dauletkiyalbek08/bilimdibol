import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Авто-«Ушёл»: закрывает забытые открытые смены (check_in есть, check_out пуст)
// по времени окончания смены сотрудника (из графика) или 18:00.
// Запускается Vercel Cron (см. vercel.json), можно дёрнуть вручную (GET).
export async function GET(req: Request) {
  // защита: если задан CRON_SECRET — требуем заголовок от Vercel Cron
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Supabase не настроен" }, { status: 503 });

  try {
    // открытые смены
    const { data: open } = await admin
      .from("attendance")
      .select("id, employee_id, comment")
      .is("check_out", null)
      .not("check_in", "is", null);

    if (!open || open.length === 0) {
      return NextResponse.json({ ok: true, closed: 0 });
    }

    // время окончания смены по графику
    const { data: sch } = await admin.from("schedules").select("employee_id, end_time");
    const endMap = new Map<string, string>();
    for (const s of sch ?? []) endMap.set(s.employee_id as string, (s.end_time as string) ?? "18:00");

    let closed = 0;
    for (const row of open) {
      const end = endMap.get(row.employee_id as string) ?? "18:00";
      const prev = (row.comment as string) ?? "";
      const { error } = await admin
        .from("attendance")
        .update({ check_out: end, comment: `${prev}${prev ? " " : ""}· авто-уход` })
        .eq("id", row.id);
      if (!error) closed++;
    }

    return NextResponse.json({ ok: true, closed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "fail" }, { status: 500 });
  }
}
