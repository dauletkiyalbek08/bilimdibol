// Marketing attribution data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { ATTRIBUTION } from "../mock/marketing";
import type { MarketingAttribution, LeadSource } from "../types";

interface AttrRow {
  id: string;
  client_name: string;
  first_touch_source: string | null;
  last_touch_source: string | null;
  assisted_source: string | null;
  utm_campaign: string | null;
  creative_id: string | null;
  confidence_score: number | null;
  converted: boolean | null;
}

function mapRow(r: AttrRow): MarketingAttribution {
  return {
    id: r.id,
    clientName: r.client_name,
    firstTouchSource: (r.first_touch_source as LeadSource) ?? "Instagram",
    lastTouchSource: (r.last_touch_source as LeadSource) ?? "Instagram",
    assistedSource: (r.assisted_source as LeadSource) ?? "Instagram",
    utmCampaign: r.utm_campaign ?? "",
    creativeId: r.creative_id ?? "",
    confidenceScore: r.confidence_score ?? 0,
    converted: r.converted ?? false,
  };
}

export async function fetchAttribution(): Promise<MarketingAttribution[]> {
  const sb = getSupabase();
  if (!sb) return ATTRIBUTION;
  try {
    const { data, error } = await sb.from("marketing_attribution").select("*");
    if (error || !data) return ATTRIBUTION;
    return (data as AttrRow[]).map(mapRow);
  } catch {
    return ATTRIBUTION;
  }
}
