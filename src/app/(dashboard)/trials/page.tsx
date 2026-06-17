"use client";

import * as React from "react";
import { CalendarCheck, CheckCircle2, XCircle, ShoppingBag, CalendarDays } from "lucide-react";
import { useApp } from "@/lib/store";
import { employeeName } from "@/lib/mock-data";
import { fetchTrials } from "@/lib/data/trials";
import { TRIAL_MAP } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { formatKzt, fmtDateTime, fmtDate } from "@/lib/utils";
import { isToday } from "date-fns";
import type { TrialLesson, TrialStatus } from "@/lib/types";

export default function TrialsPage() {
  return (
    <RoleBasedGuard page="trials">
      <TrialsInner />
    </RoleBasedGuard>
  );
}

function TrialsInner() {
  const { range } = useApp();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [trials, setTrials] = React.useState<TrialLesson[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchTrials().then((rows) => {
      if (active) setTrials(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const data = trials.filter((t) => statusFilter === "all" || t.status === statusFilter);

  const assignedToday = trials.filter((t) => isToday(new Date(t.datetime))).length;
  const completed = trials.filter((t) => t.status === "completed" || t.status === "bought").length;
  const noShow = trials.filter((t) => t.status === "no_show").length;
  const bought = trials.filter((t) => t.status === "bought").length;

  const upcoming = [...trials]
    .filter((t) => t.status === "scheduled")
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 6);

  const columns: Column<TrialLesson>[] = [
    {
      key: "client",
      header: "Клиент",
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={t.clientName} size="sm" />
          <span className="font-medium">{t.clientName}</span>
        </div>
      ),
    },
    { key: "datetime", header: "Дата и время", cell: (t) => <span className="text-muted">{fmtDateTime(t.datetime)}</span> },
    { key: "hunter", header: "Hunter", cell: (t) => employeeName(t.hunterId) },
    { key: "manager", header: "Менеджер", cell: (t) => employeeName(t.managerId) },
    { key: "status", header: "Статус", cell: (t) => <StatusBadge kind="trial" value={t.status} /> },
    { key: "result", header: "Результат", cell: (t) => <span className="block max-w-[200px] truncate text-muted">{t.result}</span> },
    { key: "course", header: "Курс", cell: (t) => t.offeredCourse },
    { key: "price", header: "Цена", align: "right", cell: (t) => <span className="font-semibold">{formatKzt(t.price)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Пробные уроки" description={`Управление пробными уроками · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Назначено сегодня" value={String(assignedToday)} icon={CalendarCheck} accent="blue" />
        <MetricCard title="Проведено" value={String(completed)} icon={CheckCircle2} accent="green" />
        <MetricCard title="Не пришли" value={String(noShow)} icon={XCircle} accent="red" />
        <MetricCard title="Купили курс" value={String(bought)} icon={ShoppingBag} accent="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Все пробные уроки</CardTitle>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="all">Все статусы</option>
              {Object.entries(TRIAL_MAP).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={data} rowKey={(t) => t.id} />
          </CardContent>
        </Card>

        {/* Calendar block */}
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4.5 text-brand" /> Ближайшие уроки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="flex size-11 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <span className="text-sm font-bold leading-none">{new Date(t.datetime).getDate()}</span>
                  <span className="text-[10px] uppercase">{fmtDate(t.datetime).split(" ")[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.clientName}</p>
                  <p className="truncate text-xs text-muted">{employeeName(t.managerId)} · {t.offeredCourse}</p>
                </div>
                <span className="text-xs font-medium text-muted">{fmtDateTime(t.datetime).split(", ")[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
