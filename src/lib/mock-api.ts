// =============================================================
// Aggregation layer. Each compute function accepts its source
// arrays (defaulting to mock data) so the same math can run over
// real Supabase rows — see lib/data/stats.ts for the async loaders.
// =============================================================
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LEADS,
  TRIALS,
  SALES,
  AD_CAMPAIGNS,
  AD_SPEND,
  FINANCE_OPS,
  PAYROLL,
  EMPLOYEES,
  HUNTERS,
  MANAGERS,
  employeeName,
  USD_RATE,
} from "./mock-data";
import { rangeDays } from "./date-range";
import type {
  DateRange,
  Lead,
  LeadStatus,
  LeadSource,
  Sale,
  TrialLesson,
  AdSpend,
  AdCampaign,
  FinanceOperation,
  PayrollRecord,
  DashboardStats,
} from "./types";

// Scale factor so changing the period visibly changes the numbers.
function scale(range: DateRange): number {
  const d = rangeDays(range);
  if (d <= 1) return 0.05;
  if (d <= 2) return 0.09;
  if (d <= 7) return 0.25;
  if (d <= 31) return 1;
  if (d <= 95) return 2.6;
  return 7.5;
}

// ---------------- Leads ----------------
export interface LeadFilters {
  status?: LeadStatus | "all";
  source?: LeadSource | "all";
  hunterId?: string | "all";
  search?: string;
}

export function getLeads(filters: LeadFilters = {}): Lead[] {
  return LEADS.filter((l) => {
    if (filters.status && filters.status !== "all" && l.status !== filters.status) return false;
    if (filters.source && filters.source !== "all" && l.source !== filters.source) return false;
    if (filters.hunterId && filters.hunterId !== "all" && l.hunterId !== filters.hunterId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.phone.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

// ---------------- Sales ----------------
export interface SaleFilters {
  method?: string;
  managerId?: string;
  search?: string;
}

export function getSales(filters: SaleFilters = {}): Sale[] {
  return SALES.filter((s) => {
    if (filters.method && filters.method !== "all" && s.method !== filters.method) return false;
    if (filters.managerId && filters.managerId !== "all" && s.managerId !== filters.managerId) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!s.clientName.toLowerCase().includes(q) && !s.course.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

// ---------------- Dashboard ----------------
export interface DashboardSource {
  leads?: Lead[];
  sales?: Sale[];
  trials?: TrialLesson[];
  adSpend?: AdSpend[];
}

export function getDashboardStats(range: DateRange, data: DashboardSource = {}): DashboardStats {
  const leadRows = data.leads ?? LEADS;
  const saleRows = data.sales ?? SALES;
  const trialRows = data.trials ?? TRIALS;
  const spendRows = data.adSpend ?? AD_SPEND;

  const k = scale(range);
  const baseRevenue = saleRows.reduce((sum, s) => sum + s.amount, 0);
  const revenue = Math.round(baseRevenue * k);
  const expenses = Math.round(revenue * 0.58);
  const netProfit = revenue - expenses;
  const leads = Math.round(leadRows.length * k * 1.4);
  const trials = Math.round(trialRows.length * k);
  const sales = Math.round(saleRows.length * k);
  const adSpend = Math.round(spendRows.reduce((s, a) => s + a.spendKzt, 0) * (k / 1));
  const cpl = Math.round(adSpend / Math.max(1, leads));
  const conversion = +((sales / Math.max(1, leads)) * 100).toFixed(1);

  // Daily trend (28 points)
  const points = 28;
  const revenueTrend = Array.from({ length: points }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (points - 1 - i));
    const wave = 0.7 + 0.5 * Math.abs(Math.sin(i / 3));
    const r = Math.round((revenue / points) * wave);
    return {
      date: format(day, "d MMM", { locale: ru }),
      revenue: r,
      expense: Math.round(r * 0.58),
    };
  });

  const salesByDay = Array.from({ length: 14 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    return {
      date: format(day, "d MMM", { locale: ru }),
      sales: Math.round((sales / 14) * (0.6 + Math.abs(Math.cos(i / 2)))),
    };
  });

  const funnel = [
    { stage: "Лиды", value: leads },
    { stage: "Пробные уроки", value: trials },
    { stage: "Продажи", value: sales },
  ];

  const topHunters = HUNTERS.map((h) => {
    const hl = leadRows.filter((l) => l.hunterId === h.id).length;
    const ht = trialRows.filter((t) => t.hunterId === h.id).length;
    const hs = saleRows.filter((s) => s.hunterId === h.id);
    return {
      name: h.name,
      leads: Math.round(hl * k * 1.4),
      trials: Math.round(ht * k),
      sales: Math.round(hs.length * k),
      revenue: Math.round(hs.reduce((sum, s) => sum + s.amount, 0) * k),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const topManagers = MANAGERS.map((m) => {
    const mt = trialRows.filter((t) => t.managerId === m.id).length;
    const ms = saleRows.filter((s) => s.managerId === m.id);
    return {
      name: m.name,
      trials: Math.round(mt * k),
      sales: Math.round(ms.length * k),
      revenue: Math.round(ms.reduce((sum, s) => sum + s.amount, 0) * k),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const recentSales = [...saleRows]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return {
    revenue,
    expenses,
    netProfit,
    leads,
    cpl,
    trials,
    sales,
    conversion,
    revenueTrend,
    funnel,
    salesByDay,
    topHunters,
    topManagers,
    recentSales,
  };
}

// ---------------- Advertising ----------------
export interface AdvertisingSource {
  adSpend?: AdSpend[];
  campaigns?: AdCampaign[];
}

export function getAdvertisingStats(range: DateRange, data: AdvertisingSource = {}) {
  const spendRows = data.adSpend ?? AD_SPEND;
  const campaignRows = data.campaigns ?? AD_CAMPAIGNS;

  const k = scale(range);
  const spendUsd = Math.round(spendRows.reduce((s, a) => s + a.spendUsd, 0) * k);
  const spendKzt = Math.round(spendUsd * USD_RATE);
  const leads = Math.round(spendRows.reduce((s, a) => s + a.leads, 0) * k);
  const revenue = Math.round(campaignRows.reduce((s, c) => s + c.revenueKzt, 0) * k);
  const trials = Math.round(leads * 0.34);
  const sales = campaignRows.reduce((s, c) => s + c.sales, 0);
  const cplUsd = +(spendUsd / Math.max(1, leads)).toFixed(2);
  const cplKzt = Math.round(cplUsd * USD_RATE);
  const roas = +(revenue / Math.max(1, spendKzt)).toFixed(2);
  const romi = +(((revenue - spendKzt) / Math.max(1, spendKzt)) * 100).toFixed(0);

  const spendByDay = spendRows.reduce<Record<string, { date: string; usd: number; kzt: number }>>(
    (acc, a) => {
      const day = format(new Date(a.date), "d MMM", { locale: ru });
      if (!acc[day]) acc[day] = { date: day, usd: 0, kzt: 0 };
      acc[day].usd += a.spendUsd;
      acc[day].kzt += a.spendKzt;
      return acc;
    },
    {},
  );

  const leadsByPlatform = (["Meta", "TikTok", "YouTube", "Google"] as const).map((p) => ({
    platform: p,
    leads: spendRows.filter((a) => a.platform === p).reduce((s, a) => s + a.leads, 0),
  }));

  return {
    spendUsd,
    spendKzt,
    leads,
    cplUsd,
    cplKzt,
    trials,
    sales: Math.round(sales * k),
    roas,
    romi,
    revenue,
    spendByDay: Object.values(spendByDay),
    leadsByPlatform,
    campaigns: campaignRows,
  };
}

// ---------------- Finance ----------------
export interface FinanceSource {
  financeOps?: FinanceOperation[];
  sales?: Sale[];
  payroll?: PayrollRecord[];
  campaigns?: AdCampaign[];
}

export function getFinanceStats(range: DateRange, data: FinanceSource = {}) {
  const opRows = data.financeOps ?? FINANCE_OPS;
  const saleRows = data.sales ?? SALES;
  const payRows = data.payroll ?? PAYROLL;
  const campaignRows = data.campaigns ?? AD_CAMPAIGNS;

  const k = scale(range);
  const income = opRows.filter((o) => o.type === "income").reduce((s, o) => s + o.amount, 0);
  const expense = opRows.filter((o) => o.type === "expense").reduce((s, o) => s + o.amount, 0);
  const revenue = Math.round(income * k);
  const expenses = Math.round(expense * k);
  const payroll = Math.round(payRows.reduce((s, p) => s + p.total, 0) * (k / 1));
  const advertising = Math.round(campaignRows.reduce((s, c) => s + c.budgetKzt, 0) * k);
  const installments = Math.round(saleRows.filter((s) => s.installment).reduce((s, x) => s + x.amount, 0) * k);
  const refunds = Math.round(
    opRows.filter((o) => o.comment.includes("Возврат")).reduce((s, o) => s + o.amount, 0) * k,
  );

  const trend = Array.from({ length: 12 }).map((_, i) => {
    const wave = 0.7 + 0.5 * Math.abs(Math.sin(i / 2));
    const r = Math.round((revenue / 12) * wave);
    return {
      label: `М${i + 1}`,
      income: r,
      expense: Math.round(r * 0.58),
      profit: Math.round(r * 0.42),
    };
  });

  const byMethod = (["Kaspi", "Наличные", "Банк", "Рассрочка", "Halyk", "Forte"] as const).map((m) => ({
    method: m,
    value: saleRows.filter((s) => s.method === m).reduce((sum, s) => sum + s.amount, 0),
  }));

  const operations = [...opRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    revenue,
    expenses,
    netProfit: revenue - expenses,
    payroll,
    advertising,
    installments,
    refunds,
    trend,
    byMethod,
    operations,
  };
}

// ---------------- Payroll ----------------
export interface PayrollSource {
  payroll?: PayrollRecord[];
}

export function getPayrollStats(_range: DateRange, data: PayrollSource = {}) {
  const payRows = data.payroll ?? PAYROLL;

  const totalFund = payRows.reduce((s, p) => s + p.total, 0);
  const totalBonus = payRows.reduce((s, p) => s + p.bonus, 0);
  const kpiDone = payRows.filter((p) => p.kpiPercent >= 80).length;
  const lateCount = payRows.filter((p) => p.attendanceScore < 90).length;
  const adjustments = payRows.reduce((s, p) => s + p.bonusAdjustment, 0);

  const structure = [
    { name: "Оклады", value: payRows.reduce((s, p) => s + p.baseSalary, 0) },
    { name: "Бонусы", value: totalBonus },
    { name: "Корректировки", value: Math.abs(adjustments) },
  ];

  const trend = Array.from({ length: 6 }).map((_, i) => ({
    label: `М${i + 1}`,
    value: Math.round(totalFund * (0.8 + i * 0.04)),
  }));

  return {
    totalFund,
    totalBonus,
    kpiDone,
    kpiTotal: payRows.length,
    lateCount,
    adjustments,
    structure,
    trend,
    records: payRows,
  };
}

// ---------------- Reports ----------------
export function getReports(_range: DateRange) {
  const now = new Date();
  return [
    { id: "r1", type: "director" as const, name: "Отчёт директора — сводный", period: "Этот месяц", generatedAt: format(now, "d MMM yyyy", { locale: ru }), status: "ready" as const },
    { id: "r2", type: "sales" as const, name: "Отчёт по продажам", period: "Последние 30 дней", generatedAt: format(now, "d MMM yyyy", { locale: ru }), status: "ready" as const },
    { id: "r3", type: "advertising" as const, name: "Отчёт по рекламе", period: "Этот месяц", generatedAt: format(now, "d MMM yyyy", { locale: ru }), status: "ready" as const },
    { id: "r4", type: "hunters" as const, name: "Отчёт по Hunter-ам", period: "Эта неделя", generatedAt: format(now, "d MMM yyyy", { locale: ru }), status: "ready" as const },
  ];
}

// Re-export helpers consumers may need
export { employeeName, EMPLOYEES };
