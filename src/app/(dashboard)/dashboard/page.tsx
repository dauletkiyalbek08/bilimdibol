"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  DollarSign,
  GraduationCap,
  ShoppingCart,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useApp } from "@/lib/store";
import { loadDashboardStats } from "@/lib/data/stats";
import { PROJECT } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { FunnelChart } from "@/components/funnel-chart";
import { ExportButton } from "@/components/export-button";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHART, axisProps } from "@/lib/chart";
import { formatKzt, formatNumber, fmtDate } from "@/lib/utils";
import { employeeName } from "@/lib/mock-data";
import type { Sale, DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const { range } = useApp();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);

  React.useEffect(() => {
    let active = true;
    loadDashboardStats(range).then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [range]);

  const recentColumns: Column<Sale>[] = [
    { key: "client", header: "Клиент", cell: (s) => <span className="font-medium">{s.clientName}</span> },
    { key: "course", header: "Курс", cell: (s) => <span className="text-muted">{s.course}</span> },
    { key: "amount", header: "Сумма", align: "right", cell: (s) => <span className="font-semibold">{formatKzt(s.amount)}</span> },
    { key: "manager", header: "Менеджер", cell: (s) => employeeName(s.managerId) },
    { key: "status", header: "Чек", cell: (s) => <StatusBadge kind="receipt" value={s.receiptStatus} /> },
    { key: "date", header: "Дата", cell: (s) => <span className="text-muted">{fmtDate(s.date)}</span> },
  ];

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${PROJECT.name} — Главная`} description={`Сводка показателей · ${range.label}`} />
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Загрузка показателей…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`${PROJECT.name} — Главная`} description={`Сводка показателей · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Доход" value={formatKzt(stats.revenue, { compact: true })} icon={Wallet} delta={12.4} accent="green" />
        <MetricCard title="Расходы" value={formatKzt(stats.expenses, { compact: true })} icon={TrendingDown} delta={-3.1} accent="orange" />
        <MetricCard title="Чистая прибыль" value={formatKzt(stats.netProfit, { compact: true })} icon={TrendingUp} delta={18.7} accent="green" />
        <MetricCard title="Лиды" value={formatNumber(stats.leads)} icon={Users} delta={8.2} accent="blue" />
        <MetricCard title="Цена лида" value={formatKzt(stats.cpl)} icon={DollarSign} delta={-5.4} accent="purple" />
        <MetricCard title="Пробные уроки" value={formatNumber(stats.trials)} icon={GraduationCap} delta={6.9} accent="yellow" />
        <MetricCard title="Продажи курса" value={formatNumber(stats.sales)} icon={ShoppingCart} delta={14.1} accent="green" />
        <MetricCard title="Конверсия" value={`${stats.conversion}%`} icon={Percent} delta={2.3} accent="orange" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Динамика дохода" description="Доход и расходы по дням" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.revenueTrend} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.green} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.orange} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={CHART.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} interval={3} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={48} />
              <Tooltip
                formatter={(v: number) => formatKzt(v)}
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }}
              />
              <Area type="monotone" dataKey="revenue" name="Доход" stroke={CHART.green} strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="expense" name="Расходы" stroke={CHART.orange} strokeWidth={2} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Воронка" description="Лид → Пробный → Продажа">
          <div className="pt-3">
            <FunnelChart stages={stats.funnel} />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Продажи по дням" description="Количество продаж за период" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.salesByDay} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} interval={1} />
              <YAxis {...axisProps} width={32} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="sales" name="Продажи" fill={CHART.green} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Расходы / Прибыль" description="Структура за период">
          <div className="space-y-4 pt-2">
            <ProfitBar label="Доход" value={stats.revenue} max={stats.revenue} color={CHART.green} />
            <ProfitBar label="Расходы" value={stats.expenses} max={stats.revenue} color={CHART.orange} />
            <ProfitBar label="Чистая прибыль" value={stats.netProfit} max={stats.revenue} color={CHART.greenDark} />
            <div className="rounded-xl bg-canvas p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Рентабельность</span>
                <Badge variant="green">{Math.round((stats.netProfit / stats.revenue) * 100)}%</Badge>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Топ Hunter-ов</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {stats.topHunters.map((h, i) => (
                <RankRow key={h.name} rank={i + 1} name={h.name} primary={formatKzt(h.revenue, { compact: true })} secondary={`${h.sales} продаж · ${h.leads} лидов`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ менеджеров</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {stats.topManagers.map((m, i) => (
                <RankRow key={m.name} rank={i + 1} name={m.name} primary={formatKzt(m.revenue, { compact: true })} secondary={`${m.sales} продаж · ${m.trials} уроков`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние продажи</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable columns={recentColumns} data={stats.recentSales} rowKey={(s) => s.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProfitBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.max(4, (Math.abs(value) / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{formatKzt(value, { compact: true })}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RankRow({ rank, name, primary, secondary }: { rank: number; name: string; primary: string; secondary: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-canvas">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
        {rank}
      </span>
      <UserAvatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="truncate text-xs text-muted">{secondary}</p>
      </div>
      <span className="text-sm font-semibold text-ink">{primary}</span>
    </div>
  );
}
