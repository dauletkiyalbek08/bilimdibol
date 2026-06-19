// Funnels / resources data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { FUNNELS } from "../mock-data";
import type { Funnel, FunnelType } from "../types";

interface FunnelRow {
  id: string;
  name: string;
  url: string | null;
  source: string | null;
  type: string | null;
  visitors: number | null;
  leads: number | null;
  conversion: number | null;
  cpl: number | null;
  sales: number | null;
  revenue: number | null;
}

function mapRow(r: FunnelRow): Funnel {
  return {
    id: r.id,
    name: r.name,
    url: r.url ?? "",
    source: r.source ?? "",
    type: (r.type as FunnelType) ?? "Landing",
    visitors: r.visitors ?? 0,
    leads: r.leads ?? 0,
    conversion: r.conversion ?? 0,
    cpl: r.cpl ?? 0,
    sales: r.sales ?? 0,
    revenue: r.revenue ?? 0,
  };
}

export async function fetchFunnels(): Promise<Funnel[]> {
  const sb = getSupabase();
  if (!sb) return FUNNELS;
  try {
    const { data, error } = await sb.from("funnels").select("*");
    if (error || !data) return FUNNELS;
    return (data as FunnelRow[]).map(mapRow);
  } catch {
    return FUNNELS;
  }
}
