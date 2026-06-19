// Creative analytics data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { CREATIVES } from "../mock/creatives";
import type { CreativeAnalytics, AdPlatform, CreativeRecommendation } from "../types";

interface CreativeRow {
  id: string;
  name: string;
  platform: string | null;
  campaign: string | null;
  views: number | null;
  clicks: number | null;
  ctr: number | null;
  leads: number | null;
  cpl: number | null;
  trials: number | null;
  sales: number | null;
  conversion: number | null;
  revenue: number | null;
  roas: number | null;
  lead_quality: number | null;
  recommendation: string | null;
}

function mapRow(r: CreativeRow): CreativeAnalytics {
  return {
    id: r.id,
    name: r.name,
    platform: (r.platform as AdPlatform) ?? "Meta",
    campaign: r.campaign ?? "",
    views: r.views ?? 0,
    clicks: r.clicks ?? 0,
    ctr: r.ctr ?? 0,
    leads: r.leads ?? 0,
    cpl: r.cpl ?? 0,
    trials: r.trials ?? 0,
    sales: r.sales ?? 0,
    conversion: r.conversion ?? 0,
    revenue: r.revenue ?? 0,
    roas: r.roas ?? 0,
    leadQuality: r.lead_quality ?? 0,
    recommendation: (r.recommendation as CreativeRecommendation) ?? "keep",
  };
}

export async function fetchCreatives(): Promise<CreativeAnalytics[]> {
  const sb = getSupabase();
  if (!sb) return CREATIVES;
  try {
    const { data, error } = await sb.from("creative_analytics").select("*");
    if (error || !data) return CREATIVES;
    return (data as CreativeRow[]).map(mapRow);
  } catch {
    return CREATIVES;
  }
}
