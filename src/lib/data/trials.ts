// Trial lessons data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { TRIALS } from "../mock-data";
import type { TrialLesson, TrialStatus } from "../types";

interface TrialRow {
  id: string;
  project_id: string | null;
  client_name: string;
  datetime: string;
  hunter_id: string | null;
  manager_id: string | null;
  status: string | null;
  result: string | null;
  offered_course: string | null;
  price: number | null;
}

function mapRow(r: TrialRow): TrialLesson {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    clientName: r.client_name,
    datetime: r.datetime,
    hunterId: r.hunter_id ?? "",
    managerId: r.manager_id ?? "",
    status: (r.status as TrialStatus) ?? "scheduled",
    result: r.result ?? "",
    offeredCourse: r.offered_course ?? "",
    price: r.price ?? 0,
  };
}

export async function fetchTrials(): Promise<TrialLesson[]> {
  const sb = getSupabase();
  if (!sb) return TRIALS;
  try {
    const { data, error } = await sb.from("trials").select("*").order("datetime", { ascending: false });
    if (error || !data) return TRIALS;
    return (data as TrialRow[]).map(mapRow);
  } catch {
    return TRIALS;
  }
}
