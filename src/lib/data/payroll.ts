// Payroll source data — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { PAYROLL } from "../mock-data";
import type { PayrollRecord, PayrollStatus, RoleId } from "../types";

interface PayrollRow {
  id: string;
  employee_id: string | null;
  role: string | null;
  base_salary: number | null;
  kpi_percent: number | null;
  sales_count: number | null;
  bonus: number | null;
  attendance_score: number | null;
  bonus_adjustment: number | null;
  total: number | null;
  status: string | null;
  users?: { name: string | null; role: string | null } | null;
}

function mapRow(r: PayrollRow): PayrollRecord {
  return {
    id: r.id,
    employeeId: r.employee_id ?? "",
    employeeName: r.users?.name ?? "—",
    role: (r.role as RoleId) ?? (r.users?.role as RoleId) ?? "hunter",
    baseSalary: r.base_salary ?? 0,
    kpiPercent: r.kpi_percent ?? 0,
    salesCount: r.sales_count ?? 0,
    bonus: r.bonus ?? 0,
    attendanceScore: r.attendance_score ?? 0,
    bonusAdjustment: r.bonus_adjustment ?? 0,
    total: r.total ?? 0,
    status: (r.status as PayrollStatus) ?? "accrued",
  };
}

export async function fetchPayroll(): Promise<PayrollRecord[]> {
  const sb = getSupabase();
  if (!sb) return PAYROLL;
  try {
    const { data, error } = await sb.from("payroll").select("*, users(name, role)");
    if (error || !data || data.length === 0) return PAYROLL;
    return (data as PayrollRow[]).map(mapRow);
  } catch {
    return PAYROLL;
  }
}
