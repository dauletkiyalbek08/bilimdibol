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

/** Live lead counts grouped by source (for funnel analytics). */
export async function fetchLeadSourceCounts(): Promise<{ source: string; count: number }[]> {
  const tally = (rows: { source?: string | null }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const s = r.source || "—";
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const sb = getSupabase();
  if (!sb) return tally(LEADS);
  try {
    const { data, error } = await sb.from("leads").select("source");
    if (error || !data) return tally(LEADS);
    return tally(data as { source: string }[]);
  } catch {
    return tally(LEADS);
  }
}

/** Update a lead's status. Returns true on success (or in mock mode). */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true; // mock mode: caller keeps local state
  try {
    const { error } = await sb.from("leads").update({ status }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/** Переназначить лид на другого хантера. Returns true on success. */
export async function updateLeadHunter(id: string, hunterId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const { error } = await sb.from("leads").update({ hunter_id: hunterId }).eq("id", id);
    await sb.from("deals").update({ hunter_id: hunterId }).eq("lead_id", id);
    return !error;
  } catch {
    return false;
  }
}

/** Удалить лид (и связанную сделку). Returns true on success. */
export async function deleteLead(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    await sb.from("deals").delete().eq("lead_id", id);
    const { error } = await sb.from("leads").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

/** Update a lead's comment. Returns true on success. */
export async function updateLeadComment(id: string, comment: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const { error } = await sb.from("leads").update({ comment }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export interface NewLeadInput {
  name: string;
  phone: string;
  source: LeadSource;
  hunterId: string;
  comment?: string;
  email?: string;
  instagram?: string;
}

/**
 * Create a lead. Inserts into Supabase when configured (returns the saved row),
 * otherwise builds a local Lead object for the in-session demo.
 */
export async function createLead(input: NewLeadInput): Promise<Lead> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  if (sb) {
    try {
      const { data, error } = await sb
        .from("leads")
        .insert({
          name: input.name,
          phone: input.phone,
          source: input.source,
          hunter_id: input.hunterId || null,
          status: "new",
          comment: input.comment ?? "",
          email: input.email ?? null,
          instagram: input.instagram ?? null,
        })
        .select("*")
        .single();
      if (!error && data) {
        // Auto-create a deal in the CRM pipeline (best-effort)
        try {
          await sb.from("deals").insert({
            lead_id: data.id,
            client_name: input.name,
            phone: input.phone,
            source: input.source,
            amount: 0,
            hunter_id: input.hunterId || null,
            stage: "new",
            next_step: "Связаться и квалифицировать",
            quality: "warm",
            probability: 10,
            comment: input.comment ?? "",
          });
        } catch {
          /* lead saved; deal is best-effort */
        }
        return mapRow(data as LeadRow);
      }
    } catch {
      /* fall through to local object */
    }
  }

  return {
    id: `lead-local-${Date.now()}`,
    projectId: "english-course",
    name: input.name,
    phone: input.phone,
    email: input.email,
    instagram: input.instagram,
    source: input.source,
    hunterId: input.hunterId,
    status: "new",
    createdAt: nowIso,
    comment: input.comment ?? "",
    history: [{ date: nowIso, author: "Вы", text: "Лид создан вручную" }],
  };
}
