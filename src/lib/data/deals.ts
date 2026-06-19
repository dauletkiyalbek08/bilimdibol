// Deals data access — Supabase when configured, else mock.
// Mirrors lib/data/leads.ts. CRM page can switch to fetchDeals()
// exactly like the Leads page uses fetchLeads().
import { getSupabase } from "../supabase/client";
import { DEALS } from "../mock/crm";
import type { Deal, DealStage, LeadQuality, LeadSource } from "../types";

interface DealRow {
  id: string;
  project_id: string | null;
  client_name: string;
  phone: string | null;
  source: string | null;
  amount: number | null;
  hunter_id: string | null;
  manager_id: string | null;
  stage: string | null;
  next_step: string | null;
  next_touch: string | null;
  quality: string | null;
  probability: number | null;
  comment: string | null;
  utm_campaign: string | null;
  creative_id: string | null;
  contract_status: string | null;
  receipt_status: string | null;
  created_at: string;
}

function mapRow(r: DealRow): Deal {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    clientName: r.client_name,
    phone: r.phone ?? "",
    source: (r.source as LeadSource) ?? "Instagram",
    amount: r.amount ?? 0,
    hunterId: r.hunter_id ?? "",
    managerId: r.manager_id ?? "",
    stage: (r.stage as DealStage) ?? "new",
    nextStep: r.next_step ?? "",
    nextTouch: r.next_touch ?? undefined,
    quality: (r.quality as LeadQuality) ?? "warm",
    probability: r.probability ?? 0,
    comment: r.comment ?? "",
    utmCampaign: r.utm_campaign ?? undefined,
    creativeId: r.creative_id ?? undefined,
    contractStatus: (r.contract_status as Deal["contractStatus"]) ?? "Нет",
    receiptStatus: (r.receipt_status as Deal["receiptStatus"]) ?? "Нет",
    createdAt: r.created_at,
    history: [],
    tasks: [],
  };
}

export async function fetchDeals(): Promise<Deal[]> {
  const sb = getSupabase();
  if (!sb) return DEALS;
  try {
    const { data, error } = await sb.from("deals").select("*").order("created_at", { ascending: false });
    if (error || !data) return DEALS;
    return (data as DealRow[]).map(mapRow);
  } catch {
    return DEALS;
  }
}

export async function updateDealStage(id: string, stage: DealStage): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const { error } = await sb.from("deals").update({ stage }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
