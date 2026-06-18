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
    if (error || !data || data.length === 0) return ATTENDANCE;
    return (data as AttendanceRow[]).map(mapRow);
  } catch {
    return ATTENDANCE;
  }
}

function nowHHMM(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Mark the current user as present (check-in). Persists to Supabase when configured. */
export async function checkIn(userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const d = new Date();
  const late = d.getHours() > 9 || (d.getHours() === 9 && d.getMinutes() > 10); // позже 09:10
  try {
    const { error } = await sb.from("attendance").insert({
      employee_id: userId,
      date: d.toISOString(),
      check_in: nowHHMM(),
      status: late ? "late" : "on_time",
      comment: late ? "Отметка прихода (опоздание)" : "Отметка прихода",
    });
    return !error;
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
