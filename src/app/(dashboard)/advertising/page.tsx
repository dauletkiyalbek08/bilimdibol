"use client";

import * as React from "react";
import {
  DollarSign,
  Wallet,
  Users,
  GraduationCap,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  Rocket,
  OctagonAlert,
  Link2,
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
  Cell,
} from "recharts";
import { useApp } from "@/lib/store";
import { loadAdvertisingStats } from "@/lib/data/stats";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Badge } from "@/components/ui/badge";
import { CHART, axisProps, PIE_COLORS } from "@/lib/chart";
import { formatKzt, formatUsd, formatNumber } from "@/lib/utils";
import type { AdCampaign } from "@/lib/types";

export default function AdvertisingPage() {
  return (
    <RoleBasedGuard page="advertising">
      <AdvertisingInner />
    </RoleBasedGuard>
  );
}

type AdStats = Awaited<ReturnType<typeof loadAdvertisingStats>>;

function AdvertisingInner() {
  const { range } = useApp();
  const [stats, setStats] = React.useState<AdStats | null>(null);

  React.useEffect(() => {
    let active = true;
    loadAdvertisingStats(range).then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [range]);

  const platformColors: Record<string, string> = {
    Meta: CHART.blue,
    TikTok: CHART.purple,
    YouTube: CHART.orange,
    Google: CHART.green,
  };

  const columns: Column<AdCampaign>[] = [
    {
      key: "platform",
      header: "Платформа",
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: platformColors[c.platform] }} />
          {c.platform}
        </span>
      ),
    },
    { key: "name", header: "Кампания", cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: "budgetUsd", header: "Бюджет $", align: "right", cell: (c) => formatUsd(c.budgetUsd) },
    { key: "budgetKzt", header: "Бюджет ₸", align: "right", cell: (c) => formatKzt(c.budgetKzt, { compact: true }) },
    { key: "leads", header: "Лиды", align: "right", cell: (c) => formatNumber(c.leads) },
    { key: "cplUsd", header: "CPL $", align: "right", cell: (c) => formatUsd(c.cplUsd) },
    { key: "cplKzt", header: "CPL ₸", align: "right", cell: (c) => formatKzt(c.cplKzt) },
    { key: "sales", header: "Продажи", align: "right", cell: (c) => formatNumber(c.sales) },
    {
      key: "romi",
      header: "ROMI",
      align: "right",
      cell: (c) => <Badge variant={c.romi > 250 ? "green" : c.romi > 80 ? "yellow" : "red"}>{c.romi}%</Badge>,
    },
    {
      key: "rec",
      header: "AI рекомендация",
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Sparkles className="size-3.5 text-accent-yellow" /> {c.recommendation}
        </span>
      ),
    },
  ];

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Реклама" description={`Дашборд таргетолога · ${range.label}`} />
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Загрузка рекламной аналитики…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Реклама" description={`Дашборд таргетолога · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Расходы $" value={formatUsd(stats.spendUsd)} icon={DollarSign} accent="blue" />
        <MetricCard title="Расходы ₸" value={formatKzt(stats.spendKzt, { compact: true })} icon={Wallet} accent="orange" />
        <MetricCard title="Лиды" value={formatNumber(stats.leads)} icon={Users} accent="green" />
        <MetricCard title="CPL $" value={formatUsd(stats.cplUsd)} icon={DollarSign} accent="purple" />
        <MetricCard title="CPL ₸" value={formatKzt(stats.cplKzt)} icon={Wallet} accent="yellow" />
        <MetricCard title="Пробные уроки" value={formatNumber(stats.trials)} icon={GraduationCap} accent="yellow" />
        <MetricCard title="Продажи" value={formatNumber(stats.sales)} icon={ShoppingCart} accent="green" />
        <MetricCard title="ROAS" value={`${stats.roas}x`} icon={TrendingUp} accent="green" />
        <MetricCard title="ROMI" value={`${stats.romi}%`} icon={TrendingUp} accent="orange" />
        <MetricCard title="Выручка" value={formatKzt(stats.revenue, { compact: true })} icon={Wallet} accent="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Расходы по дням" description="Рекламный бюджет (₸)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.spendByDay} margin={{ left: -8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.orange} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" {...axisProps} interval={4} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
              <Tooltip formatter={(v: number) => formatKzt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Area type="monotone" dataKey="kzt" name="Расходы ₸" stroke={CHART.orange} strokeWidth={2} fill="url(#spend)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Лиды по платформам" description="Распределение лидов">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.leadsByPlatform} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="platform" {...axisProps} width={60} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="leads" name="Лиды" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {stats.leadsByPlatform.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI recommendations */}
      <AiRecommendations campaigns={stats.campaigns} />

      <ChartCard title="Эффективность кампаний" description="Метрики по всем активным кампаниям" bodyClassName="p-0">
        <DataTable columns={columns} data={stats.campaigns} rowKey={(c) => c.id} />
      </ChartCard>
    </div>
  );
}

function AiRecommendations({ campaigns }: { campaigns: AdCampaign[] }) {
  const sorted = [...campaigns].sort((a, b) => b.romi - a.romi);
  const scale = sorted.filter((c) => c.romi > 250).slice(0, 3);
  const stop = sorted.filter((c) => c.romi < 80).slice(-3);
  const best = sorted[0];
  const highCpl = [...campaigns].sort((a, b) => b.cplKzt - a.cplKzt)[0];

  const blocks = [
    {
      icon: Rocket,
      tone: "bg-brand-50/60 text-brand-700",
      title: "Масштабировать",
      items: scale.length ? scale.map((c) => `${c.name} — ROMI ${c.romi}%, бюджет +30%`) : ["Нет кампаний с ROMI выше 250%"],
    },
    {
      icon: OctagonAlert,
      tone: "bg-red-50/60 text-red-700",
      title: "Остановить / пересобрать",
      items: stop.length ? stop.map((c) => `${c.name} — ROMI ${c.romi}%, слабая отдача`) : ["Слабых кампаний не найдено"],
    },
    {
      icon: DollarSign,
      tone: "bg-amber-50/60 text-amber-700",
      title: "Высокий CPL",
      items: [`${highCpl.name} — CPL ${formatKzt(highCpl.cplKzt)} (${highCpl.platform}). Обновить креатив или аудиторию.`],
    },
    {
      icon: Link2,
      tone: "bg-sky-50/60 text-sky-700",
      title: "Лучшая связка",
      items: [`${best.name} (${best.platform}): креатив → ${best.leads} лидов → пробные → ${best.sales} продаж. Связка работает лучше всех.`],
    },
  ];

  return (
    <ChartCard title="AI рекомендации по кампаниям" description="Что масштабировать, что остановить и где растёт CPL">
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border border-border p-3">
            <p className={`mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium ${b.tone}`}>
              <b.icon className="size-4" /> {b.title}
            </p>
            <ul className="space-y-1 text-sm text-ink">
              {b.items.map((it, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-yellow" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
