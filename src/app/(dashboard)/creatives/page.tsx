"use client";

import * as React from "react";
import { Image as ImageIcon, MousePointerClick, Target, TrendingUp, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useApp } from "@/lib/store";
import { REC_META } from "@/lib/mock/creatives";
import { fetchCreatives } from "@/lib/data/creatives";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { CHART, axisProps } from "@/lib/chart";
import { formatKzt, formatNumber, formatPercent } from "@/lib/utils";
import type { CreativeAnalytics } from "@/lib/types";

export default function CreativesPage() {
  return (
    <RoleBasedGuard page="creatives">
      <CreativesInner />
    </RoleBasedGuard>
  );
}

function qualityColor(q: number) {
  return q >= 70 ? CHART.green : q >= 50 ? CHART.yellow : CHART.orange;
}

function CreativesInner() {
  const { range } = useApp();
  const [creatives, setCreatives] = React.useState<CreativeAnalytics[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchCreatives().then((rows) => {
      if (active) setCreatives(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const totalLeads = creatives.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = creatives.reduce((s, c) => s + c.revenue, 0);
  const avgCpl = creatives.length ? Math.round(creatives.reduce((s, c) => s + c.cpl, 0) / creatives.length) : 0;
  const avgRoas = creatives.length ? +(creatives.reduce((s, c) => s + c.roas, 0) / creatives.length).toFixed(2) : 0;

  const cplData = [...creatives].sort((a, b) => a.cpl - b.cpl).map((c) => ({ name: c.name, cpl: c.cpl }));
  const salesData = [...creatives].sort((a, b) => b.sales - a.sales).slice(0, 8).map((c) => ({ name: c.name, sales: c.sales }));
  const qualityData = [...creatives].sort((a, b) => b.leadQuality - a.leadQuality).map((c) => ({ name: c.name, quality: c.leadQuality }));
  const roasData = [...creatives].sort((a, b) => b.roas - a.roas).map((c) => ({ name: c.name, roas: c.roas }));

  const short = (n: string) => (n.length > 16 ? n.slice(0, 15) + "…" : n);

  const columns: Column<CreativeAnalytics>[] = [
    { key: "name", header: "Креатив", cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: "platform", header: "Платформа", cell: (c) => <Badge variant="gray">{c.platform}</Badge> },
    { key: "campaign", header: "Кампания", cell: (c) => <span className="text-muted">{c.campaign}</span> },
    { key: "views", header: "Просмотры", align: "right", cell: (c) => formatNumber(c.views) },
    { key: "clicks", header: "Клики", align: "right", cell: (c) => formatNumber(c.clicks) },
    { key: "ctr", header: "CTR", align: "right", cell: (c) => formatPercent(c.ctr) },
    { key: "leads", header: "Лиды", align: "right", cell: (c) => formatNumber(c.leads) },
    { key: "cpl", header: "CPL", align: "right", cell: (c) => formatKzt(c.cpl) },
    { key: "trials", header: "Пробные", align: "right", cell: (c) => formatNumber(c.trials) },
    { key: "sales", header: "Продажи", align: "right", cell: (c) => formatNumber(c.sales) },
    { key: "conv", header: "Конв.", align: "right", cell: (c) => formatPercent(c.conversion) },
    { key: "revenue", header: "Доход", align: "right", cell: (c) => formatKzt(c.revenue, { compact: true }) },
    { key: "roas", header: "ROAS", align: "right", cell: (c) => <Badge variant={c.roas >= 3 ? "green" : c.roas >= 1.5 ? "yellow" : "red"}>{c.roas}x</Badge> },
    {
      key: "quality",
      header: "Качество",
      align: "right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full" style={{ width: `${c.leadQuality}%`, backgroundColor: qualityColor(c.leadQuality) }} />
          </div>
          <span className="text-xs text-muted">{c.leadQuality}</span>
        </div>
      ),
    },
    {
      key: "rec",
      header: "AI рекомендация",
      cell: (c) => (
        <Badge variant={REC_META[c.recommendation].variant as BadgeProps["variant"]}>
          <Sparkles className="size-3" /> {REC_META[c.recommendation].label}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика креативов" description={`Какой креатив приносит дешёвые и качественные лиды · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Лиды с креативов" value={formatNumber(totalLeads)} icon={Target} accent="green" />
        <MetricCard title="Средний CPL" value={formatKzt(avgCpl)} icon={MousePointerClick} accent="orange" />
        <MetricCard title="Средний ROAS" value={`${avgRoas}x`} icon={TrendingUp} accent="green" />
        <MetricCard title="Доход с креативов" value={formatKzt(totalRevenue, { compact: true })} icon={ImageIcon} accent="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="CPL по креативам" description="Чем ниже — тем дешевле лид">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cplData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} tickFormatter={short} />
              <Tooltip formatter={(v: number) => formatKzt(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="cpl" name="CPL" fill={CHART.orange} radius={[0, 6, 6, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Продажи по креативам" description="Топ по количеству продаж">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} tickFormatter={short} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="sales" name="Продажи" fill={CHART.green} radius={[0, 6, 6, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Качество лидов" description="Оценка качества по креативам (0-100)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={qualityData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} tickFormatter={short} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="quality" name="Качество" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {qualityData.map((d, i) => (
                  <Cell key={i} fill={qualityColor(d.quality)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ROAS по креативам" description="Окупаемость рекламных затрат">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roasData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} tickFormatter={short} />
              <Tooltip formatter={(v: number) => `${v}x`} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="roas" name="ROAS" fill={CHART.blue} radius={[0, 6, 6, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Все креативы" description="Полная таблица эффективности" bodyClassName="p-0">
        <DataTable columns={columns} data={creatives} rowKey={(c) => c.id} emptyTitle="Загрузка креативов…" />
      </ChartCard>
    </div>
  );
}
