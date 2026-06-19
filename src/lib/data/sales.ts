// Sales data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { SALES } from "../mock-data";
import type { Sale, PaymentMethod, ReceiptStatus } from "../types";

interface SaleRow {
  id: string;
  project_id: string | null;
  client_name: string;
  course: string | null;
  amount: number | null;
  method: string | null;
  manager_id: string | null;
  hunter_id: string | null;
  receipt_status: string | null;
  contract_status: string | null;
  capi_sent: boolean | null;
  installment: boolean | null;
  created_at: string;
}

function mapRow(r: SaleRow): Sale {
  return {
    id: r.id,
    projectId: r.project_id ?? "english-course",
    clientName: r.client_name,
    course: r.course ?? "",
    amount: r.amount ?? 0,
    method: (r.method as PaymentMethod) ?? "Kaspi",
    managerId: r.manager_id ?? "",
    hunterId: r.hunter_id ?? "",
    receiptStatus: (r.receipt_status as ReceiptStatus) ?? "pending",
    contractStatus: (r.contract_status as Sale["contractStatus"]) ?? "Черновик",
    capiSent: r.capi_sent ?? false,
    date: r.created_at,
    installment: r.installment ?? false,
  };
}

export async function fetchSales(): Promise<Sale[]> {
  const sb = getSupabase();
  if (!sb) return SALES;
  try {
    const { data, error } = await sb.from("sales").select("*").order("created_at", { ascending: false });
    if (error || !data) return SALES;
    return (data as SaleRow[]).map(mapRow);
  } catch {
    return SALES;
  }
}

export async function updateReceiptStatus(id: string, status: ReceiptStatus): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const { error } = await sb.from("sales").update({ receipt_status: status }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
