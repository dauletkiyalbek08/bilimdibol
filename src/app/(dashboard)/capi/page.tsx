"use client";

import * as React from "react";
import { Webhook, CheckCircle2, Activity, Send, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchSales } from "@/lib/data/sales";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtDateTime } from "@/lib/utils";
import type { Sale } from "@/lib/types";

const EVENTS = [
  { name: "Lead", desc: "Новый лид из воронки", enabled: true },
  { name: "Schedule", desc: "Назначен пробный урок", enabled: true },
  { name: "Purchase", desc: "Покупка курса", enabled: true },
  { name: "CompleteRegistration", desc: "Регистрация на квизе", enabled: false },
];

export default function CapiPage() {
  return (
    <RoleBasedGuard page="capi">
      <CapiInner />
    </RoleBasedGuard>
  );
}

function CapiInner() {
  const { range } = useApp();
  const [events, setEvents] = React.useState(EVENTS);
  const [connected, setConnected] = React.useState(false);
  const [sales, setSales] = React.useState<Sale[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchSales().then((rows) => {
      if (active) setSales(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const sent = sales.filter((s) => s.capiSent).length;
  const pending = sales.length - sent;

  const log: (Sale & { event: string })[] = sales.slice(0, 10).map((s, i) => ({
    ...s,
    event: ["Purchase", "Lead", "Schedule"][i % 3],
  }));

  const columns: Column<Sale & { event: string }>[] = [
    { key: "event", header: "Событие", cell: (s) => <Badge variant="blue">{s.event}</Badge> },
    { key: "client", header: "Клиент", cell: (s) => <span className="font-medium">{s.clientName}</span> },
    { key: "platform", header: "Назначение", cell: () => "Meta CAPI" },
    {
      key: "status",
      header: "Статус",
      cell: (s) =>
        s.capiSent ? (
          <Badge variant="green"><CheckCircle2 className="size-3" /> Доставлено</Badge>
        ) : (
          <Badge variant="yellow"><AlertTriangle className="size-3" /> В очереди</Badge>
        ),
    },
    { key: "date", header: "Время", cell: (s) => <span className="text-muted">{fmtDateTime(s.date)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="CAPI" description={`Conversions API · server-side события · ${range.label}`} />

      {/* Connection banner (stub) */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Webhook className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">Meta Conversions API</p>
              <p className="text-sm text-muted">
                {connected ? "Подключено · события отправляются server-side" : "Заготовка интеграции — реальное подключение появится позже"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={connected ? "green" : "gray"}>
              {connected ? "Активно" : "Не подключено"}
            </Badge>
            <Button variant={connected ? "outline" : "default"} onClick={() => setConnected((c) => !c)}>
              {connected ? "Отключить" : "Подключить (демо)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Событий отправлено" value={String(sent)} icon={Send} accent="green" />
        <MetricCard title="В очереди" value={String(pending)} icon={Activity} accent="yellow" />
        <MetricCard title="Match Rate" value="72%" icon={CheckCircle2} accent="blue" />
        <MetricCard title="Активных событий" value={String(events.filter((e) => e.enabled).length)} icon={Webhook} accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Журнал событий</CardTitle>
            <CardDescription>Последние server-side конверсии</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={log} rowKey={(s) => s.id} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройка событий</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((e, i) => (
                <div key={e.name} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{e.name}</p>
                    <p className="text-xs text-muted">{e.desc}</p>
                  </div>
                  <Switch
                    checked={e.enabled}
                    onCheckedChange={(v) => setEvents((prev) => prev.map((x, idx) => (idx === i ? { ...x, enabled: v } : x)))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Доступ к API</CardTitle>
              <CardDescription>Заполняется при реальном подключении</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Pixel ID</label>
                <Input placeholder="000000000000000" disabled />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Access Token</label>
                <Input placeholder="••••••••••••••••" disabled />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
