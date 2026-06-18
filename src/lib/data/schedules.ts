// Графики работы — из Supabase, иначе пусто (демо).
import { getSupabase } from "../supabase/client";

export interface Schedule {
  employeeId: string;
  weekdays: number[]; // 1=Пн … 7=Вс
  start: string;
  end: string;
}

export const WEEKDAYS = [
  { n: 1, label: "Пн" },
  { n: 2, label: "Вт" },
  { n: 3, label: "Ср" },
  { n: 4, label: "Чт" },
  { n: 5, label: "Пт" },
  { n: 6, label: "Сб" },
  { n: 7, label: "Вс" },
];

interface ScheduleRow {
  employee_id: string;
  weekdays: number[] | null;
  start_time: string | null;
  end_time: string | null;
}

export async function fetchSchedules(): Promise<Record<string, Schedule>> {
  const sb = getSupabase();
  const map: Record<string, Schedule> = {};
  if (!sb) return map;
  try {
    const { data, error } = await sb.from("schedules").select("*");
    if (error || !data) return map;
    for (const r of data as ScheduleRow[]) {
      map[r.employee_id] = {
        employeeId: r.employee_id,
        weekdays: r.weekdays ?? [1, 2, 3, 4, 5],
        start: r.start_time ?? "09:00",
        end: r.end_time ?? "18:00",
      };
    }
    return map;
  } catch {
    return map;
  }
}

export async function saveSchedule(s: Schedule): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("schedules").upsert({
      employee_id: s.employeeId,
      weekdays: s.weekdays,
      start_time: s.start,
      end_time: s.end,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
