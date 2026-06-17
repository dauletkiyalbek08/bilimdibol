"use client";

import * as React from "react";
import { GraduationCap, ShoppingCart, Users, Banknote, Star } from "lucide-react";
import { useApp } from "@/lib/store";
import { MANAGERS } from "@/lib/mock-data";
import { fetchTrials } from "@/lib/data/trials";
import { fetchSales } from "@/lib/data/sales";
import { fetchClients } from "@/lib/data/clients";
import { fetchPayroll } from "@/lib/data/payroll";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { formatKzt, fmtDate, fmtDateTime } from "@/lib/utils";
import type { TrialLesson, Sale, Client, PayrollRecord } from "@/lib/types";

export default function ManagersPage() {
  return (
    <RoleBasedGuard page="managers">
      <ManagersInner />
    </RoleBasedGuard>
  );
}

function ManagersInner() {
  const { role, range } = useApp();
  const isManagerRole = role === "manager";
  const [managerId, setManagerId] = React.useState(MANAGERS[0].id);
  const activeId = isManagerRole ? MANAGERS[0].id : managerId;
  const manager = MANAGERS.find((m) => m.id === activeId)!;

  const [trials, setTrials] = React.useState<TrialLesson[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [payrollAll, setPayrollAll] = React.useState<PayrollRecord[]>([]);

  React.useEffect(() => {
    let active = true;
    Promise.all([fetchTrials(), fetchSales(), fetchClients(), fetchPayroll()]).then(([t, s, c, p]) => {
      if (active) {
        setTrials(t);
        setSales(s);
        setClients(c);
        setPayrollAll(p);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const myTrials = trials.filter((t) => t.managerId === activeId);
  const mySales = sales.filter((s) => s.managerId === activeId);
  const myClients = clients.filter((c) => c.managerId === activeId);
  const myRevenue = mySales.reduce((s, x) => s + x.amount, 0);
  const payroll = payrollAll.find((p) => p.employeeId === activeId);

  const [tab, setTab] = React.useState<"trials" | "sales">("trials");

  const trialColumns: Column<TrialLesson>[] = [
    { key: "client", header: "Клиент", cell: (t) => <span className="font-medium">{t.clientName}</span> },
    { key: "dt", header: "Дата", cell: (t) => <span className="text-muted">{fmtDateTime(t.datetime)}</span> },
    { key: "course", header: "Курс", cell: (t) => t.offeredCourse },
    { key: "status", header: "Статус", cell: (t) => <StatusBadge kind="trial" value={t.status} /> },
  ];
  const salesColumns: Column<Sale>[] = [
    { key: "client", header: "Клиент", cell: (s) => <span className="font-medium">{s.clientName}</span> },
    { key: "course", header: "Курс", cell: (s) => s.course },
    { key: "amount", header: "Сумма", align: "right", cell: (s) => <span className="font-semibold">{formatKzt(s.amount)}</span> },
    { key: "receipt", header: "Чек", cell: (s) => <StatusBadge kind="receipt" value={s.receiptStatus} /> },
    { key: "date", header: "Дата", cell: (s) => <span className="text-muted">{fmtDate(s.date)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Менеджеры / Учителя" description={`Кабинет преподавателя · ${range.label}`}>
        {!isManagerRole && (
          <Select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-48">
            {MANAGERS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-50 to-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={manager.name} color={manager.avatarColor} size="lg" />
            <div>
              <p className="text-lg font-semibold text-ink">{manager.name}</p>
              <p className="text-sm text-muted">Менеджер / Учитель · {manager.phone}</p>
            </div>
          </div>
          <Badge variant="yellow" className="gap-1">
            <Star className="size-3.5" /> Рейтинг 4.{6 + (activeId.length % 3)}/5
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Пробные уроки" value={String(myTrials.length)} icon={GraduationCap} accent="yellow" />
        <MetricCard title="Продажи" value={String(mySales.length)} icon={ShoppingCart} accent="green" />
        <MetricCard title="Мои клиенты" value={String(myClients.length)} icon={Users} accent="blue" />
        <MetricCard title="Бонус" value={formatKzt(payroll?.bonus ?? 0, { compact: true })} icon={Banknote} accent="purple" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Моя работа</CardTitle>
          <div className="inline-flex items-center gap-1 rounded-xl bg-canvas p-1">
            <button
              onClick={() => setTab("trials")}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${tab === "trials" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
            >
              Пробные уроки
            </button>
            <button
              onClick={() => setTab("sales")}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${tab === "sales" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
            >
              Продажи
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tab === "trials" ? (
            <DataTable columns={trialColumns} data={myTrials} rowKey={(t) => t.id} />
          ) : (
            <DataTable columns={salesColumns} data={mySales} rowKey={(s) => s.id} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сводка по доходу</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <SummaryStat label="Выручка с продаж" value={formatKzt(myRevenue, { compact: true })} />
          <SummaryStat label="Средний чек" value={formatKzt(mySales.length ? Math.round(myRevenue / mySales.length) : 0, { compact: true })} />
          <SummaryStat label="Итого к выплате" value={formatKzt(payroll?.total ?? 0, { compact: true })} />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-canvas p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}
