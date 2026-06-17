"use client";

import * as React from "react";
import { ExternalLink, Workflow, Users, Target, Wallet, Copy, Check, ListChecks, LayoutTemplate } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchFunnels } from "@/lib/data/funnels";
import { fetchLeadSourceCounts } from "@/lib/data/leads";
import { FUNNEL_OFFERS } from "@/lib/funnels-config";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKzt, formatNumber, formatPercent } from "@/lib/utils";
import type { Funnel } from "@/lib/types";

const LIVE_FUNNELS = [
  { title: "Квиз «Подбор программы»", path: "/quiz", type: "Квиз" as const },
  { title: "Лендинг (общий)", path: "/lp", type: "Лендинг" as const },
  ...FUNNEL_OFFERS.map((o) => ({ title: o.title, path: `/f/${o.slug}`, type: "Лендинг" as const })),
];

function LiveFunnelLinks() {
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);
  React.useEffect(() => setOrigin(window.location.origin), []);

  function copy(path: string) {
    navigator.clipboard?.writeText(`${origin}${path}`).catch(() => {});
    setCopied(path);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ссылки воронок</CardTitle>
        <CardDescription>Готовые лендинги и квиз — заявки летят прямо в CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {LIVE_FUNNELS.map((f) => (
          <div key={f.path} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                {f.type === "Квиз" ? <ListChecks className="size-4" /> : <LayoutTemplate className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{f.title}</p>
                <code className="block truncate text-xs text-muted">{origin}{f.path}</code>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="outline" size="iconSm" onClick={() => copy(f.path)} title="Копировать">
                {copied === f.path ? <Check className="text-brand" /> : <Copy />}
              </Button>
              <a href={f.path} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="iconSm" title="Открыть"><ExternalLink /></Button>
              </a>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveSourceCounts() {
  const [rows, setRows] = React.useState<{ source: string; count: number }[]>([]);
  React.useEffect(() => {
    let active = true;
    fetchLeadSourceCounts().then((r) => active && setRows(r));
    return () => {
      active = false;
    };
  }, []);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Лиды по источникам</CardTitle>
        <CardDescription>Живые данные из CRM · всего {total}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted">Пока нет лидов</p>}
        {rows.map((r) => (
          <div key={r.source}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink">{r.source}</span>
              <span className="font-medium text-muted">{r.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand" style={{ width: `${total ? (r.count / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  return (
    <RoleBasedGuard page="resources">
      <ResourcesInner />
    </RoleBasedGuard>
  );
}

function ResourcesInner() {
  const { range } = useApp();
  const [funnels, setFunnels] = React.useState<Funnel[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchFunnels().then((rows) => {
      if (active) setFunnels(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const totalVisitors = funnels.reduce((s, f) => s + f.visitors, 0);
  const totalLeads = funnels.reduce((s, f) => s + f.leads, 0);
  const totalSales = funnels.reduce((s, f) => s + f.sales, 0);
  const totalRevenue = funnels.reduce((s, f) => s + f.revenue, 0);

  const columns: Column<Funnel>[] = [
    {
      key: "name",
      header: "Название",
      cell: (f) => (
        <div>
          <p className="font-medium">{f.name}</p>
          <a href="#" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
            {f.url} <ExternalLink className="size-3" />
          </a>
        </div>
      ),
    },
    { key: "source", header: "Источник", cell: (f) => f.source },
    { key: "type", header: "Тип", cell: (f) => <Badge variant="gray">{f.type}</Badge> },
    { key: "visitors", header: "Посетители", align: "right", cell: (f) => formatNumber(f.visitors) },
    { key: "leads", header: "Лиды", align: "right", cell: (f) => formatNumber(f.leads) },
    {
      key: "conv",
      header: "Конверсия",
      align: "right",
      cell: (f) => <Badge variant={f.conversion > 8 ? "green" : f.conversion > 5 ? "yellow" : "gray"}>{formatPercent(f.conversion)}</Badge>,
    },
    { key: "cpl", header: "CPL", align: "right", cell: (f) => formatKzt(f.cpl) },
    { key: "sales", header: "Продажи", align: "right", cell: (f) => formatNumber(f.sales) },
    { key: "revenue", header: "Доход", align: "right", cell: (f) => <span className="font-semibold">{formatKzt(f.revenue, { compact: true })}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Ресурсы / Воронки" description={`Сайты, лендинги и воронки · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Посетители" value={formatNumber(totalVisitors)} icon={Users} accent="blue" />
        <MetricCard title="Лиды" value={formatNumber(totalLeads)} icon={Target} accent="green" />
        <MetricCard title="Продажи" value={formatNumber(totalSales)} icon={Workflow} accent="yellow" />
        <MetricCard title="Доход с воронок" value={formatKzt(totalRevenue, { compact: true })} icon={Wallet} accent="green" />
      </div>

      {/* Live funnels: real links + live lead counts from CRM */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LiveFunnelLinks />
        <LiveSourceCounts />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Аналитика воронок</CardTitle>
          <CardDescription>Посещаемость и конверсия по источникам</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={funnels} rowKey={(f) => f.id} emptyTitle="Загрузка воронок…" />
        </CardContent>
      </Card>
    </div>
  );
}
