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
