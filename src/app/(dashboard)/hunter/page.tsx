"use client";

import * as React from "react";
import { Users, GraduationCap, ShoppingCart, Banknote, Target, Trophy } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useApp } from "@/lib/store";
import { HUNTERS } from "@/lib/mock-data";
import { fetchLeads } from "@/lib/data/leads";
import { fetchTrials } from "@/lib/data/trials";
import { fetchSales } from "@/lib/data/sales";
import { fetchPayroll } from "@/lib/data/payroll";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { CHART, axisProps } from "@/lib/chart";
import { formatKzt, fmtDate } from "@/lib/utils";
import type { Lead, TrialLesson, Sale, PayrollRecord } from "@/lib/types";

export default function HunterPage() {
  return (
    <RoleBasedGuard page="hunter">
      <HunterInner />
    </RoleBasedGuard>
  );
}

function HunterInner() {
  const { role, range } = useApp();
  // If logged in as hunter, lock to the first hunter; otherwise allow selection.
  const isHunterRole = role === "hunter";
  const [hunterId, setHunterId] = React.useState(HUNTERS[0].id);
  const activeId = isHunterRole ? HUNTERS[0].id : hunterId;
  const hunter = HUNTERS.find((h) => h.id === activeId)!;

  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [trials, setTrials] = React.useState<TrialLesson[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [payrollAll, setPayrollAll] = React.useState<PayrollRecord[]>([]);

  React.useEffect(() => {
    let active = true;
    Promise.all([fetchLeads(), fetchTrials(), fetchSales(), fetchPayroll()]).then(([l, t, s, p]) => {
      if (active) {
        setLeads(l);
        setTrials(t);
        setSales(s);
        setPayrollAll(p);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const myLeads = leads.filter((l) => l.hunterId === activeId);
  const myTrials = trials.filter((t) => t.hunterId === activeId);
  const mySales = sales.filter((s) => s.hunterId === activeId);
  const myRevenue = mySales.reduce((s, x) => s + x.amount, 0);
  const payroll = payrollAll.find((p) => p.employeeId === activeId);

  const conv = myLeads.length ? ((mySales.length / myLeads.length) * 100).toFixed(1) : "0";

  const weekly = Array.from({ length: 7 }).map((_, i) => ({
    day: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i],
    leads: 2 + ((i * 3 + activeId.length) % 8),
    sales: (i + activeId.length) % 4,
  }));

  const leadColumns: Column<Lead>[] = [
    { key: "name", header: "Клиент", cell: (l) => <span className="font-medium">{l.name}</span> },
    { key: "phone", header: "Телефон", cell: (l) => <span className="text-muted">{l.phone}</span> },
    { key: "source", header: "Источник", cell: (l) => l.source },
    { key: "status", header: "Статус", cell: (l) => <StatusBadge kind="lead" value={l.status} /> },
    { key: "date", header: "Заявка", cell: (l) => <span className="text-muted">{fmtDate(l.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Hunter кабинет" description={`Личный кабинет · ${range.label}`}>
        {!isHunterRole && (
          <Select value={hunterId} onChange={(e) => setHunterId(e.target.value)} className="w-48">
            {HUNTERS.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </Select>
        )}
      </PageHeader>

      {/* Profile banner */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-50 to-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={hunter.name} color={hunter.avatarColor} size="lg" />
            <div>
              <p className="text-lg font-semibold text-ink">{hunter.name}</p>
              <p className="text-sm text-muted">Hunter · {hunter.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted">Выполнение KPI</p>
              <p className="text-xl font-bold text-brand-700">{payroll?.kpiPercent ?? 0}%</p>
            </div>
            <Badge variant="green" className="gap-1">
              <Trophy className="size-3.5" /> {mySales.length >= 12 ? "Топ-перформер" : "В работе"}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard title="Мои лиды" value={String(myLeads.length)} icon={Users} accent="blue" />
        <MetricCard title="Пробные уроки" value={String(myTrials.length)} icon={GraduationCap} accent="yellow" />
        <MetricCard title="Продажи" value={String(mySales.length)} icon={ShoppingCart} accent="green" />
        <MetricCard title="Конверсия" value={`${conv}%`} icon={Target} accent="orange" />
        <MetricCard title="Бонус к выплате" value={formatKzt(payroll?.bonus ?? 0, { compact: true })} icon={Banknote} accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Активность за неделю" description="Лиды и продажи по дням" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekly} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...axisProps} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="leads" name="Лиды" fill={CHART.blue} radius={[6, 6, 0, 0]} maxBarSize={20} />
              <Bar dataKey="sales" name="Продажи" fill={CHART.green} radius={[6, 6, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Мой бонус</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <BonusRow label="Выручка" value={formatKzt(myRevenue, { compact: true })} />
            <BonusRow label="Бонус с продаж" value={formatKzt(payroll?.bonus ?? 0, { compact: true })} />
            <BonusRow label="Посещаемость" value={`${payroll?.attendanceScore ?? 0}%`} />
            <BonusRow
              label="Корректировка бонуса"
              value={formatKzt(payroll?.bonusAdjustment ?? 0, { compact: true })}
              highlight={(payroll?.bonusAdjustment ?? 0) < 0}
            />
            <div className="border-t border-border pt-3">
              <BonusRow label="Итого к выплате" value={formatKzt(payroll?.total ?? 0, { compact: true })} bold />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Мои лиды</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={leadColumns} data={myLeads} rowKey={(l) => l.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function BonusRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={bold ? "text-base font-bold text-ink" : highlight ? "font-semibold text-orange-600" : "font-medium text-ink"}>
        {value}
      </span>
    </div>
  );
}
