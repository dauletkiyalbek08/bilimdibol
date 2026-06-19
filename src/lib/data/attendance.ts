// Attendance data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { ATTENDANCE } from "../mock-data";
import type { AttendanceRecord, AttendanceStatus, RoleId } from "../types";

interface AttendanceRow {
  id: string;
  employee_id: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  comment: string | null;
  lat: number | null;
  lng: number | null;
  users?: { name: string | null; role: string | null } | null;
}

function mapRow(r: AttendanceRow): AttendanceRecord {
  return {
    id: r.id,
    employeeId: r.employee_id ?? "",
    employeeName: r.users?.name ?? "—",
    role: (r.users?.role as RoleId) ?? "hunter",
    date: r.date,
    checkIn: r.check_in ?? undefined,
    checkOut: r.check_out ?? undefined,
    status: (r.status as AttendanceStatus) ?? "on_time",
    comment: r.comment ?? "",
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
  };
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const sb = getSupabase();
  if (!sb) return ATTENDANCE;
  try {
    const { data, error } = await sb
      .from("attendance")
      .select("*, users(name, role)")
      .order("date", { ascending: false });
    if (error || !data) return ATTENDANCE;
    return (data as AttendanceRow[]).map(mapRow);
  } catch {
    return ATTENDANCE;
  }
}

function nowHHMM(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Mark the current user as present (check-in). Persists to Supabase when configured. */
export async function checkIn(
  userId: string,
  coords?: { lat: number; lng: number },
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const d = new Date();

  // Опоздание считаем от начала смены по графику (если задан), иначе 09:10
  let startMin = 9 * 60 + 10; // дефолт «позже 09:10»
  let scheduledToday = true;
  try {
    const { data: sc } = await sb
      .from("schedules")
      .select("weekdays, start_time")
      .eq("employee_id", userId)
      .single();
    if (sc) {
      const iso = d.getDay() === 0 ? 7 : d.getDay(); // 1=Пн … 7=Вс
      scheduledToday = (sc.weekdays ?? [1, 2, 3, 4, 5]).includes(iso);
      const [sh, sm] = String(sc.start_time ?? "09:00").split(":").map(Number);
      startMin = sh * 60 + sm + 5; // 5 минут запаса
    }
  } catch {
    /* нет графика — дефолт */
  }

  const nowMin = d.getHours() * 60 + d.getMinutes();
  const late = scheduledToday && nowMin > startMin;
  const comment = !scheduledToday
    ? "Отметка прихода (вне графика) · 📍 в офисе"
    : late
      ? "Отметка прихода (опоздание) · 📍 в офисе"
      : "Отметка прихода · 📍 в офисе";

  const base = {
    employee_id: userId,
    date: d.toISOString(),
    check_in: nowHHMM(),
    status: late ? "late" : "on_time",
    comment,
  };
  try {
    const { error } = await sb.from("attendance").insert({
      ...base,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
    if (!error) return true;
    // Колонок lat/lng ещё нет (миграция не применена) — пишем без геоданных
    const { error: e2 } = await sb.from("attendance").insert(base);
    return !e2;
  } catch {
    return false;
  }
}

/** Mark the current user's departure (check-out) on today's open record. */
export async function checkOut(userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await sb
      .from("attendance")
      .select("id, check_out")
      .eq("employee_id", userId)
      .gte("date", todayStart.toISOString())
      .order("date", { ascending: false })
      .limit(1);
    const row = data?.[0] as { id: string; check_out: string | null } | undefined;
    if (row && !row.check_out) {
      await sb.from("attendance").update({ check_out: nowHHMM() }).eq("id", row.id);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
