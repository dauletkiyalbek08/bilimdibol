// Calls data access — Supabase when configured, else mock.
// Analysis lives in the call_analysis table and is computed on demand
// via the AI button, so list rows load with analysis = null from the DB.
import { getSupabase } from "../supabase/client";
import { CALLS } from "../mock/calls";
import type { CallRecord, CallLanguage, CallAnalysisStatus, RoleId } from "../types";

interface CallRow {
  id: string;
  employee_id: string | null;
  deal_id: string | null;
  client_name: string;
  duration_sec: number | null;
  language: string | null;
  status: string | null;
  score: number | null;
  result: string | null;
  transcript: { speaker: "agent" | "client"; text: string }[] | null;
  created_at: string;
  users?: { name: string | null; role: string | null } | null;
}

function mapRow(r: CallRow): CallRecord {
  return {
    id: r.id,
    date: r.created_at,
    employeeId: r.employee_id ?? "",
    employeeName: r.users?.name ?? "—",
    role: (r.users?.role as RoleId) ?? "hunter",
    clientName: r.client_name,
    durationSec: r.duration_sec ?? 0,
    language: (r.language as CallLanguage) ?? "ru",
    status: (r.status as CallAnalysisStatus) ?? "pending",
    score: r.score ?? null,
    result: r.result ?? "",
    dealId: r.deal_id ?? undefined,
    transcript: r.transcript ?? [],
    analysis: null,
  };
}

export async function fetchCalls(): Promise<CallRecord[]> {
  const sb = getSupabase();
  if (!sb) return CALLS;
  try {
    const { data, error } = await sb
      .from("calls")
      .select("*, users(name, role)")
      .order("created_at", { ascending: false });
    if (error || !data) return CALLS;
    return (data as CallRow[]).map(mapRow);
  } catch {
    return CALLS;
  }
}
