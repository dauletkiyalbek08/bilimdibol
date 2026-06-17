"use client";

import * as React from "react";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Banknote,
  Megaphone,
  CreditCard,
  Undo2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useApp } from "@/lib/store";
import { loadFinanceStats } from "@/lib/data/stats";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { CHART, axisProps, PIE_COLORS } from "@/lib/chart";
import { formatKzt, fmtDate } from "@/lib/utils";
import type { FinanceOperation } from "@/lib/types";

export default function FinancePage() {
  return (
    <RoleBasedGuard page="finance">
      <FinanceInner />
    </RoleBasedGuard>
  );
}

type FinanceStats = Awaited<ReturnType<typeof loadFinanceStats>>;

function FinanceInner() {
  const { range } = useApp();
  const [stats, setStats] = React.useState<FinanceStats | null>(null);
  const [typeFilter, setTypeFilter] = React.useState("all");

  React.useEffect(() => {
    let active = true;
    loadFinanceStats(range).then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [range]);

  const columns: Column<FinanceOperation>[] = [
    { key: "date", header: "Дата", cell: (o) => <span className="text-muted">{fmtDate(o.date)}</span> },
    { key: "category", header: "Категория", cell: (o) => <span className="font-medium">{o.category}</span> },
    {
      key: "type",
      header: "Тип",
      cell: (o) => <Badge variant={o.type === "income" ? "green" : "orange"}>{o.type === "income" ? "Доход" : "Расход"}</Badge>,
    },
    {
      key: "amount",
      header: "Сумма",
      align: "right",
      cell: (o) => (
        <span className={o.type === "income" ? "font-semibold text-brand-700" : "font-semibold text-orange-600"}>
          {o.type === "income" ? "+" : "−"}{formatKzt(o.amount)}
        </span>
      ),
    },
    { key: "responsible", header: "Ответственный", cell: (o) => o.responsible },
    { key: "comment", header: "Комментарий", cell: (o) => <span className="text-muted">{o.comment}</span> },
  ];

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Финансы" description={`Денежный поток · все суммы в ₸ · ${range.label}`} />
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Загрузка финансов…
        </div>
      </div>
    );
  }

  const operations = stats.operations.filter((o) => typeFilter === "all" || o.type === typeFilter);

  return (
    <div className="space-y-6">
      <PageHeader title="Финансы" description={`Денежный поток · все суммы в ₸ · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Общий доход" value={formatKzt(stats.revenue, { compact: true })} icon={Wallet} delta={11.2} accent="green" />
        <MetricCard title="Расходы" value={formatKzt(stats.expenses, { compact: true })} icon={TrendingDown} delta={-2.8} accent="orange" />
        <MetricCard title="Чистая прибыль" value={formatKzt(stats.netProfit, { compact: true })} icon={TrendingUp} delta={16.4} accent="green" />
        <MetricCard title="Зарплаты" value={formatKzt(stats.payroll, { compact: true })} icon={Banknote} accent="purple" />
        <MetricCard title="Реклама" value={formatKzt(stats.advertising, { compact: true })} icon={Megaphone} accent="blue" />
        <MetricCard title="Рассрочки" value={formatKzt(stats.installments, { compact: true })} icon={CreditCard} accent="yellow" />
        <MetricCard title="Возвраты" value={formatKzt(stats.refunds, { compact: true })} icon={Undo2} accent="red" />
        <MetricCard title="Рентабельность" value={`${Math.round((stats.netProfit / stats.revenue) * 100)}%`} icon={TrendingUp} accent="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Доход vs Расходы" description="Помесячная динамика" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.trend} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} width={40} />
              <Tooltip formatter={(v: number) => formatKzt(v, { compact: true })} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Доход" fill={CHART.green} radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expense" name="Расходы" fill={CHART.orange} radius={[6, 6, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Способы оплаты" description="Распределение выручки">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.byMethod} dataKey="value" nameKey="method" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {stats.byMethod.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatKzt(v, { compact: true })} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Динамика прибыли" description="Чистая прибыль по месяцам">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.trend} margin={{ left: -8, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} width={40} />
            <Tooltip formatter={(v: number) => formatKzt(v, { compact: true })} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
            <Line type="monotone" dataKey="profit" name="Прибыль" stroke={CHART.greenDark} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Операции"
        description="Доходы и расходы"
        action={
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-40">
            <option value="all">Все операции</option>
            <option value="income">Только доходы</option>
            <option value="expense">Только расходы</option>
          </Select>
        }
        bodyClassName="p-0"
      >
        <DataTable columns={columns} data={operations} rowKey={(o) => o.id} />
      </ChartCard>
    </div>
  );
}
