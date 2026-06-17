// =============================================================
// Async aggregate loaders. When Supabase is configured they pull
// real rows from the data modules and run the shared compute math;
// otherwise they fall back to the mock computation.
// =============================================================
import { isSupabaseConfigured } from "../supabase/config";
import {
  getDashboardStats,
  getAdvertisingStats,
  getFinanceStats,
  getPayrollStats,
} from "../mock-api";
import { fetchLeads } from "./leads";
import { fetchSales } from "./sales";
import { fetchTrials } from "./trials";
import { fetchAdCampaigns, fetchAdSpend } from "./advertising";
import { fetchFinanceOps } from "./finance";
import { fetchPayroll } from "./payroll";
import type { DateRange } from "../types";

export async function loadDashboardStats(range: DateRange) {
  if (!isSupabaseConfigured) return getDashboardStats(range);
  const [leads, sales, trials, adSpend] = await Promise.all([
    fetchLeads(),
    fetchSales(),
    fetchTrials(),
    fetchAdSpend(),
  ]);
  return getDashboardStats(range, { leads, sales, trials, adSpend });
}

export async function loadAdvertisingStats(range: DateRange) {
  if (!isSupabaseConfigured) return getAdvertisingStats(range);
  const [adSpend, campaigns] = await Promise.all([fetchAdSpend(), fetchAdCampaigns()]);
  return getAdvertisingStats(range, { adSpend, campaigns });
}

export async function loadFinanceStats(range: DateRange) {
  if (!isSupabaseConfigured) return getFinanceStats(range);
  const [financeOps, sales, payroll, campaigns] = await Promise.all([
    fetchFinanceOps(),
    fetchSales(),
    fetchPayroll(),
    fetchAdCampaigns(),
  ]);
  return getFinanceStats(range, { financeOps, sales, payroll, campaigns });
}

export async function loadPayrollStats(range: DateRange) {
  if (!isSupabaseConfigured) return getPayrollStats(range);
  const payroll = await fetchPayroll();
  return getPayrollStats(range, { payroll });
}
