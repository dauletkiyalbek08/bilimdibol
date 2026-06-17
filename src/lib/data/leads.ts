// =============================================================
// Leads data access. Uses Supabase when configured, otherwise
// returns mock data. This is the reference pattern for migrating
// the rest of the app off mock data.
// =============================================================
import { getSupabase } from "../supabase/client";
import { LEADS } from "../mock-data";
import type { Lead, LeadSource, LeadStatus } from "../types";

interface LeadRow {
  id: string;
  project_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  source: string | null;
  hunter_id: string | null;
  status: string | null;
  next_touch: string | null;
  comment: string | null;
  created_at: string;
}

function mapRow(r: LeadRow): Lead {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    name: r.name,
    phone: r.phone ?? "",
    email: r.email ?? undefined,
    instagram: r.instagram ?? undefined,
    source: (r.source as LeadSource) ?? "Instagram",
    hunterId: r.hunter_id ?? "",
    status: (r.status as LeadStatus) ?? "new",
    createdAt: r.created_at,
    nextTouch: r.next_touch ?? undefined,
    comment: r.comment ?? "",
    history: [], // history lives in deal_activities; loaded on demand
  };
}

/** Load leads — Supabase if configured, else mock. */
export async function fetchLeads(): Promise<Lead[]> {
  const sb = getSupabase();
  if (!sb) return LEADS;
  try {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return LEADS;
    return (data as LeadRow[]).map(mapRow);
  } catch {
    return LEADS;
  }
}

/** Update a lead's status — persists to Supabase when configured. */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const sb = getSupabase();
  if (!sb) return; // mock mode: caller keeps local state
  try {
    await sb.from("leads").update({ status }).eq("id", id);
  } catch {
    /* ignore in demo */
  }
}
