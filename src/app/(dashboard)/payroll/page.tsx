"use client";

import * as React from "react";
import {
  Banknote,
  Gift,
  Target,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useApp } from "@/lib/store";
import { loadPayrollStats } from "@/lib/data/stats";
import { getRole } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { CHART, axisProps, PIE_COLORS } from "@/lib/chart";
import { formatKzt } from "@/lib/utils";
import type { PayrollRecord, PayrollStatus } from "@/lib/types";

export default function PayrollPage() {
  return (
    <RoleBasedGuard page="payroll">
      <PayrollInner />
    </RoleBasedGuard>
  );
}

type PayrollStats = Awaited<ReturnType<typeof loadPayrollStats>>;

function PayrollInner() {
  const { range } = useApp();
  const [stats, setStats] = React.useState<PayrollStats | null>(null);
  const [records, setRecords] = React.useState<PayrollRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    loadPayrollStats(range).then((s) => {
      if (active) {
        setStats(s);
        setRecords(s.records);
      }
    });
    return () => {
      active = false;
    };
  }, [range]);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  function approve(id: string) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "paid" as PayrollStatus } : r)));
  }

  const columns: Column<PayrollRecord>[] = [
    {
      key: "name",
      header: "Сотрудник",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={r.employeeName} size="sm" />
          <span className="font-medium">{r.employeeName}</span>
        </div>
      ),
    },
    { key: "role", header: "Роль", cell: (r) => <span className="text-muted">{getRole(r.role).short}</span> },
    { key: "base", header: "Ставка", align: "right", cell: (r) => formatKzt(r.baseSalary, { compact: true }) },
    {
      key: "kpi",
      header: "KPI / Продажи",
      align: "right",
      cell: (r) => (
        <span>
          {r.kpiPercent}% {r.salesCount > 0 && <span className="text-muted">· {r.salesCount}</span>}
        </span>
      ),
    },
    { key: "bonus", header: "Бонус", align: "right", cell: (r) => formatKzt(r.bonus, { compact: true }) },
    { key: "att", header: "Посещ.", align: "right", cell: (r) => `${r.attendanceScore}%` },
    {
      key: "adj",
      header: "Корректировка",
      align: "right",
      cell: (r) => (
        <span className={r.bonusAdjustment < 0 ? "text-orange-600" : r.bonusAdjustment > 0 ? "text-brand-700" : "text-muted"}>
          {r.bonusAdjustment === 0 ? "—" : `${r.bonusAdjustment > 0 ? "+" : "−"}${formatKzt(Math.abs(r.bonusAdjustment), { compact: true })}`}
        </span>
      ),
    },
    { key: "total", header: "Итого", align: "right", cell: (r) => <span className="font-semibold">{formatKzt(r.total, { compact: true })}</span> },
    { key: "status", header: "Статус", cell: (r) => <StatusBadge kind="payroll" value={r.status} /> },
  ];

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Зарплаты" description={`Начисления и бонусы · ${range.label}`} />
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Загрузка начислений…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Зарплаты" description={`Начисления и бонусы · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard title="Фонд зарплаты" value={formatKzt(stats.totalFund, { compact: true })} icon={Banknote} accent="green" />
        <MetricCard title="Бонусы" value={formatKzt(stats.totalBonus, { compact: true })} icon={Gift} accent="yellow" />
        <MetricCard title="KPI выполнено" value={`${stats.kpiDone}/${stats.kpiTotal}`} icon={Target} accent="blue" />
        <MetricCard title="Опоздания" value={String(stats.lateCount)} icon={Clock} accent="orange" />
        <MetricCard title="Корректировки бонуса" value={formatKzt(stats.adjustments, { compact: true })} icon={SlidersHorizontal} accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Динамика выплат" description="Фонд оплаты труда по месяцам" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.trend} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} width={40} />
              <Tooltip formatter={(v: number) => formatKzt(v, { compact: true })} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Line type="monotone" dataKey="value" name="Выплаты" stroke={CHART.green} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Структура зарплаты" description="Оклады, бонусы, корректировки">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.structure} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={3}>
                {stats.structure.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatKzt(v, { compact: true })} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Таблица начислений</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={records}
              rowKey={(r) => r.id}
              onRowClick={(r) => setSelectedId(r.id)}
              activeRowKey={selectedId ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Employee detail card */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <Card>
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selected.employeeName} size="lg" />
                  <div>
                    <p className="font-semibold text-ink">{selected.employeeName}</p>
                    <p className="text-sm text-muted">{getRole(selected.role).name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded-lg p-1 text-muted hover:bg-canvas">
                  <X className="size-4" />
                </button>
              </div>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Ставка" value={formatKzt(selected.baseSalary)} />
                <DetailRow label="Бонус" value={formatKzt(selected.bonus)} />
                <DetailRow label="KPI" value={`${selected.kpiPercent}%`} />
                <DetailRow label="Посещаемость" value={`${selected.attendanceScore}%`} />
                <DetailRow
                  label="Корректировка бонуса"
                  value={selected.bonusAdjustment === 0 ? "—" : `${selected.bonusAdjustment > 0 ? "+" : "−"}${formatKzt(Math.abs(selected.bonusAdjustment))}`}
                  accent={selected.bonusAdjustment < 0 ? "orange" : selected.bonusAdjustment > 0 ? "green" : undefined}
                />
                <div className="rounded-xl bg-canvas p-3">
                  <DetailRow label="Итог к выплате" value={formatKzt(selected.total)} bold />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted">Статус</span>
                  <StatusBadge kind="payroll" value={selected.status} />
                </div>
                <div className="grid gap-2 pt-2">
                  <Button onClick={() => approve(selected.id)} disabled={selected.status === "paid"}>
                    <CheckCircle2 /> {selected.status === "paid" ? "Выплачено" : "Подтвердить начисление"}
                  </Button>
                  <Button variant="outline">
                    <Eye /> Смотреть детали
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <UserAvatar name="? ?" size="lg" className="bg-border" />
                <p className="mt-3 font-medium text-ink">Выберите сотрудника</p>
                <p className="mt-1 text-sm text-muted">Нажмите на строку таблицы</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: "green" | "orange" }) {
  const color = accent === "green" ? "text-brand-700" : accent === "orange" ? "text-orange-600" : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={bold ? "text-base font-bold text-ink" : `font-medium ${color}`}>{value}</span>
    </div>
  );
}
