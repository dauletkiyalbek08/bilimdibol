"use client";

import * as React from "react";
import {
  Radar,
  Instagram,
  MessageSquare,
  Megaphone,
  ThumbsUp,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";
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
import { leadsBySource, qualityBySource, MARKETING_RECOMMENDATIONS } from "@/lib/mock/marketing";
import { fetchAttribution } from "@/lib/data/marketing";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART, axisProps, PIE_COLORS } from "@/lib/chart";
import { formatNumber, cn } from "@/lib/utils";
import type { MarketingAttribution } from "@/lib/types";

export default function MarketingPage() {
  return (
    <RoleBasedGuard page="marketing">
      <MarketingInner />
    </RoleBasedGuard>
  );
}

function confidenceVariant(c: number): "green" | "yellow" | "red" {
  return c >= 75 ? "green" : c >= 55 ? "yellow" : "red";
}

function MarketingInner() {
  const { range } = useApp();
  const [touch, setTouch] = React.useState<"firstTouchSource" | "lastTouchSource" | "assistedSource">("firstTouchSource");
  const [attribution, setAttribution] = React.useState<MarketingAttribution[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchAttribution().then((rows) => {
      if (active) setAttribution(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const sourceData = leadsBySource(touch, attribution);
  const quality = qualityBySource(attribution);

  const igLeads = attribution.filter((a) => a.lastTouchSource === "Instagram").length;
  const waLeads = attribution.filter((a) => a.lastTouchSource === "WhatsApp").length;
  const adLeads = attribution.filter((a) => a.firstTouchSource === "Meta Ads" || a.firstTouchSource === "Google Ads").length;
  const avgConfidence = attribution.length
    ? Math.round(attribution.reduce((s, a) => s + a.confidenceScore, 0) / attribution.length)
    : 0;

  const columns: Column<MarketingAttribution>[] = [
    { key: "client", header: "Клиент", cell: (a) => <span className="font-medium">{a.clientName}</span> },
    { key: "first", header: "First touch", cell: (a) => <Badge variant="blue">{a.firstTouchSource}</Badge> },
    {
      key: "assisted",
      header: "Assisted",
      cell: (a) => <Badge variant="purple">{a.assistedSource}</Badge>,
    },
    { key: "last", header: "Last touch", cell: (a) => <Badge variant="green">{a.lastTouchSource}</Badge> },
    { key: "utm", header: "UTM кампания", cell: (a) => <code className="text-xs text-muted">{a.utmCampaign}</code> },
    { key: "creative", header: "Креатив", cell: (a) => <span className="text-muted">{a.creativeId}</span> },
    {
      key: "confidence",
      header: "Source confidence",
      align: "right",
      cell: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-canvas">
            <div className={cn("h-full rounded-full", a.confidenceScore >= 75 ? "bg-brand" : a.confidenceScore >= 55 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${a.confidenceScore}%` }} />
          </div>
          <Badge variant={confidenceVariant(a.confidenceScore)}>{a.confidenceScore}%</Badge>
        </div>
      ),
    },
    {
      key: "conv",
      header: "Конверсия",
      cell: (a) => (a.converted ? <Badge variant="green">Купил</Badge> : <Badge variant="gray">В работе</Badge>),
    },
  ];

  const recIcon = { good: ThumbsUp, warn: AlertTriangle, bad: XCircle } as const;
  const recStyle = {
    good: "bg-brand-50/60 text-brand-700",
    warn: "bg-amber-50/60 text-amber-700",
    bad: "bg-red-50/60 text-red-700",
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Dashboard" description={`Источники, качество лидов и атрибуция · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Лиды из Instagram bio" value={formatNumber(igLeads)} icon={Instagram} accent="purple" />
        <MetricCard title="Лиды из WhatsApp" value={formatNumber(waLeads)} icon={MessageSquare} accent="green" />
        <MetricCard title="Лиды из рекламы" value={formatNumber(adLeads)} icon={Megaphone} accent="blue" />
        <MetricCard title="Средний confidence" value={`${avgConfidence}%`} icon={Radar} accent="yellow" />
      </div>

      {/* Attribution problem explainer */}
      <Card className="border-dashed">
        <CardContent className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Radar className="size-4.5 text-brand" /> Проблема атрибуции
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {["Реклама (Meta)", "Instagram", "Bio link", "WhatsApp", "Заявка"].map((step, i, arr) => (
              <React.Fragment key={step}>
                <span className="rounded-lg bg-canvas px-3 py-1.5 font-medium text-ink">{step}</span>
                {i < arr.length - 1 && <ArrowRight className="size-4 text-muted" />}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            Клиент видит рекламу, переходит в Instagram, затем оставляет номер через bio link и пишет в WhatsApp.
            Система определяет реальный источник через first / last / assisted touch и оценивает достоверность (confidence).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Лиды по источникам"
          description="Сравните разные модели атрибуции"
          action={
            <Tabs
              value={touch}
              onChange={(v) => setTouch(v as typeof touch)}
              tabs={[
                { value: "firstTouchSource", label: "First" },
                { value: "lastTouchSource", label: "Last" },
                { value: "assistedSource", label: "Assisted" },
              ]}
            />
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sourceData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="source" {...axisProps} width={90} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="leads" name="Лиды" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Качество лидов по источникам" description="Source confidence × конверсия">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={quality} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...axisProps} />
              <YAxis type="category" dataKey="source" {...axisProps} width={90} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="quality" name="Качество" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {quality.map((d, i) => (
                  <Cell key={i} fill={d.quality >= 70 ? CHART.green : d.quality >= 50 ? CHART.yellow : CHART.orange} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендации маркетологу</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {MARKETING_RECOMMENDATIONS.map((r, i) => {
            const Icon = recIcon[r.type as keyof typeof recIcon];
            return (
              <div key={i} className={cn("flex items-start gap-2 rounded-lg p-3 text-sm", recStyle[r.type as keyof typeof recStyle])}>
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span>{r.text}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ChartCard title="Карта атрибуции" description="First / last / assisted touch по клиентам" bodyClassName="p-0">
        <DataTable columns={columns} data={attribution} rowKey={(a) => a.id} emptyTitle="Загрузка атрибуции…" />
      </ChartCard>
    </div>
  );
}
