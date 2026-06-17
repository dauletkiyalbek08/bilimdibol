// Advertising source data — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { AD_CAMPAIGNS, AD_SPEND } from "../mock-data";
import type { AdCampaign, AdSpend, AdPlatform } from "../types";

interface CampaignRow {
  id: string;
  project_id: string | null;
  platform: string | null;
  name: string;
  budget_usd: number | null;
  budget_kzt: number | null;
  leads: number | null;
  cpl_usd: number | null;
  cpl_kzt: number | null;
  sales: number | null;
  revenue_kzt: number | null;
  romi: number | null;
  recommendation: string | null;
}

interface SpendRow {
  date: string;
  platform: string | null;
  spend_usd: number | null;
  spend_kzt: number | null;
  leads: number | null;
}

function mapCampaign(r: CampaignRow): AdCampaign {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    platform: (r.platform as AdPlatform) ?? "Meta",
    name: r.name,
    budgetUsd: r.budget_usd ?? 0,
    budgetKzt: r.budget_kzt ?? 0,
    leads: r.leads ?? 0,
    cplUsd: r.cpl_usd ?? 0,
    cplKzt: r.cpl_kzt ?? 0,
    sales: r.sales ?? 0,
    revenueKzt: r.revenue_kzt ?? 0,
    romi: r.romi ?? 0,
    recommendation: r.recommendation ?? "",
  };
}

function mapSpend(r: SpendRow): AdSpend {
  return {
    date: r.date,
    platform: (r.platform as AdPlatform) ?? "Meta",
    spendUsd: r.spend_usd ?? 0,
    spendKzt: r.spend_kzt ?? 0,
    leads: r.leads ?? 0,
  };
}

export async function fetchAdCampaigns(): Promise<AdCampaign[]> {
  const sb = getSupabase();
  if (!sb) return AD_CAMPAIGNS;
  try {
    const { data, error } = await sb.from("ad_campaigns").select("*");
    if (error || !data || data.length === 0) return AD_CAMPAIGNS;
    return (data as CampaignRow[]).map(mapCampaign);
  } catch {
    return AD_CAMPAIGNS;
  }
}

export async function fetchAdSpend(): Promise<AdSpend[]> {
  const sb = getSupabase();
  if (!sb) return AD_SPEND;
  try {
    const { data, error } = await sb.from("ad_spend").select("*").order("date", { ascending: true });
    if (error || !data || data.length === 0) return AD_SPEND;
    return (data as SpendRow[]).map(mapSpend);
  } catch {
    return AD_SPEND;
  }
}
