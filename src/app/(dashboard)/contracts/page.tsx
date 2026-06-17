"use client";

import * as React from "react";
import {
  FileText,
  FileSignature,
  FileCheck2,
  FileClock,
  Plus,
  Eye,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchContracts } from "@/lib/data/contracts";
import { CONTRACT_MAP } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";
import type { Contract, ContractType } from "@/lib/types";

const DOC_TEMPLATES: { type: ContractType; desc: string }[] = [
  { type: "Договор с учеником", desc: "Основной договор на обучение" },
  { type: "Договор рассрочки", desc: "Оплата частями" },
  { type: "Оферта", desc: "Публичная оферта на услуги" },
  { type: "Согласие на обработку ПД", desc: "Персональные данные" },
  { type: "Договор с сотрудником", desc: "Трудовой договор" },
  { type: "NDA", desc: "Соглашение о неразглашении" },
  { type: "KPI-приложение", desc: "Приложение о KPI и бонусах" },
  { type: "Акт оказанных услуг", desc: "Закрывающий документ" },
];

export default function ContractsPage() {
  return (
    <RoleBasedGuard page="contracts">
      <ContractsInner />
    </RoleBasedGuard>
  );
}

function ContractsInner() {
  const { range } = useApp();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [contracts, setContracts] = React.useState<Contract[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchContracts().then((rows) => {
      if (active) setContracts(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const data = contracts.filter((c) => statusFilter === "all" || c.status === statusFilter);

  const signed = contracts.filter((c) => c.status === "signed").length;
  const sent = contracts.filter((c) => c.status === "sent").length;
  const draft = contracts.filter((c) => c.status === "draft").length;

  const columns: Column<Contract>[] = [
    {
      key: "type",
      header: "Документ",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-canvas text-muted">
            <FileText className="size-4" />
          </span>
          <span className="font-medium">{c.type}</span>
        </div>
      ),
    },
    { key: "party", header: "Клиент / Сотрудник", cell: (c) => c.party },
    { key: "status", header: "Статус", cell: (c) => <StatusBadge kind="contract" value={c.status} /> },
    { key: "created", header: "Создан", cell: (c) => <span className="text-muted">{fmtDate(c.createdAt)}</span> },
    { key: "signed", header: "Подписан", cell: (c) => <span className="text-muted">{c.signedAt ? fmtDate(c.signedAt) : "—"}</span> },
    {
      key: "action",
      header: "Действие",
      cell: (c) => (
        <div className="flex gap-1.5">
          <Button variant="ghost" size="iconSm" title="Просмотр"><Eye className="size-4" /></Button>
          {c.status !== "signed" && (
            <Button variant="ghost" size="iconSm" title="Отправить"><Send className="size-4" /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Договоры" description={`Документооборот · UI-заглушка · ${range.label}`}>
        <Button><Plus /> Новый документ</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Всего документов" value={String(contracts.length)} icon={FileText} accent="blue" />
        <MetricCard title="Подписано" value={String(signed)} icon={FileCheck2} accent="green" />
        <MetricCard title="Отправлено" value={String(sent)} icon={FileSignature} accent="yellow" />
        <MetricCard title="Черновики" value={String(draft)} icon={FileClock} accent="orange" />
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Шаблоны документов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOC_TEMPLATES.map((t) => (
              <button
                key={t.type}
                className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-brand/40 hover:bg-canvas"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{t.type}</p>
                  <p className="text-xs text-muted">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Документы <Badge variant="gray">{data.length}</Badge>
          </CardTitle>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="all">Все статусы</option>
            {Object.entries(CONTRACT_MAP).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={data} rowKey={(c) => c.id} />
        </CardContent>
      </Card>
    </div>
  );
}
