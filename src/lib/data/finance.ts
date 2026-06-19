// Finance operations source data — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { FINANCE_OPS } from "../mock-data";
import type { FinanceOperation, FinanceType } from "../types";

interface OpRow {
  id: string;
  date: string;
  category: string | null;
  type: string | null;
  amount: number | null;
  responsible: string | null;
  comment: string | null;
}

function mapRow(r: OpRow): FinanceOperation {
  return {
    id: r.id,
    date: r.date,
    category: r.category ?? "",
    type: (r.type as FinanceType) ?? "income",
    amount: r.amount ?? 0,
    responsible: r.responsible ?? "",
    comment: r.comment ?? "",
  };
}

export async function fetchFinanceOps(): Promise<FinanceOperation[]> {
  const sb = getSupabase();
  if (!sb) return FINANCE_OPS;
  try {
    const { data, error } = await sb.from("finance_operations").select("*").order("date", { ascending: false });
    if (error || !data) return FINANCE_OPS;
    return (data as OpRow[]).map(mapRow);
  } catch {
    return FINANCE_OPS;
  }
}
