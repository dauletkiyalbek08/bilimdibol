"use client";

import * as React from "react";
import { ExternalLink, Workflow, Users, Target, Wallet } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchFunnels } from "@/lib/data/funnels";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKzt, formatNumber, formatPercent } from "@/lib/utils";
import type { Funnel } from "@/lib/types";

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

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={funnels} rowKey={(f) => f.id} emptyTitle="Загрузка воронок…" />
        </CardContent>
      </Card>
    </div>
  );
}
