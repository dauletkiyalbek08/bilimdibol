// SMM content plan data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { SMM_PLAN } from "../mock/smm";
import type { SmmContentPlanItem, SmmFormat, SmmStatus } from "../types";

interface PlanRow {
  id: string;
  topic: string;
  format: string | null;
  rubric: string | null;
  goal: string | null;
  cta: string | null;
  status: string | null;
  publish_date: string | null;
}

function mapRow(r: PlanRow): SmmContentPlanItem {
  return {
    id: r.id,
    topic: r.topic,
    format: (r.format as SmmFormat) ?? "Instagram post",
    rubric: r.rubric ?? "",
    goal: r.goal ?? "",
    cta: r.cta ?? "",
    status: (r.status as SmmStatus) ?? "idea",
    publishDate: r.publish_date ?? new Date().toISOString(),
  };
}

export async function fetchContentPlan(): Promise<SmmContentPlanItem[]> {
  const sb = getSupabase();
  if (!sb) return SMM_PLAN;
  try {
    const { data, error } = await sb.from("smm_content_plan").select("*").order("publish_date", { ascending: false });
    if (error || !data || data.length === 0) return SMM_PLAN;
    return (data as PlanRow[]).map(mapRow);
  } catch {
    return SMM_PLAN;
  }
}
