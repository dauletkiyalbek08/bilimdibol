"use client";

import * as React from "react";
import {
  Wallet,
  ShoppingCart,
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileSignature,
  Webhook,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchSales, updateReceiptStatus } from "@/lib/data/sales";
import { MANAGERS, PAYMENT_METHODS, employeeName } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { ExportButton } from "@/components/export-button";
import { ReceiptPreview } from "@/components/receipt-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatKzt, fmtDate } from "@/lib/utils";
import type { Sale, ReceiptStatus } from "@/lib/types";

export default function SalesPage() {
  return (
    <RoleBasedGuard page="sales">
      <SalesInner />
    </RoleBasedGuard>
  );
}

function SalesInner() {
  const { range } = useApp();
  const [method, setMethod] = React.useState("all");
  const [manager, setManager] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeReceiptId, setActiveReceiptId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchSales().then((rows) => {
      if (mounted) {
        setSales(rows);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = sales.filter((s) => {
    if (method !== "all" && s.method !== method) return false;
    if (manager !== "all" && s.managerId !== manager) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.clientName.toLowerCase().includes(q) && !s.course.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.amount, 0);
  const avgCheck = filtered.length ? Math.round(totalRevenue / filtered.length) : 0;
  const installmentCount = filtered.filter((s) => s.installment).length;
  const kaspiCount = filtered.filter((s) => s.method === "Kaspi").length;

  const pending = sales.filter((s) => s.receiptStatus === "pending");
  const active = sales.find((s) => s.id === activeReceiptId) ?? pending[0] ?? null;

  function setReceipt(id: string, status: ReceiptStatus) {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, receiptStatus: status } : s)));
    void updateReceiptStatus(id, status); // persists to Supabase when configured
    setActiveReceiptId(null);
  }

  const columns: Column<Sale>[] = [
    { key: "client", header: "Клиент", cell: (s) => <span className="font-medium">{s.clientName}</span> },
    { key: "course", header: "Курс", cell: (s) => <span className="text-muted">{s.course}</span> },
    { key: "amount", header: "Сумма", align: "right", cell: (s) => <span className="font-semibold">{formatKzt(s.amount)}</span> },
    { key: "method", header: "Оплата", cell: (s) => <Badge variant="gray">{s.method}</Badge> },
    { key: "manager", header: "Менеджер", cell: (s) => employeeName(s.managerId) },
    { key: "hunter", header: "Hunter", cell: (s) => employeeName(s.hunterId) },
    { key: "receipt", header: "Чек", cell: (s) => <StatusBadge kind="receipt" value={s.receiptStatus} /> },
    {
      key: "contract",
      header: "Договор",
      cell: (s) => (
        <span className="inline-flex items-center gap-1 text-muted">
          <FileSignature className="size-3.5" /> {s.contractStatus}
        </span>
      ),
    },
    {
      key: "capi",
      header: "CAPI",
      cell: (s) => (
        <Badge variant={s.capiSent ? "green" : "gray"}>
          <Webhook className="size-3" /> {s.capiSent ? "Отправлен" : "—"}
        </Badge>
      ),
    },
    { key: "date", header: "Дата", cell: (s) => <span className="text-muted">{fmtDate(s.date)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Продажи" description={`Сделки и проверка чеков · ${range.label}`}>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard title="Общая выручка" value={formatKzt(totalRevenue, { compact: true })} icon={Wallet} accent="green" />
        <MetricCard title="Количество продаж" value={String(filtered.length)} icon={ShoppingCart} accent="blue" />
        <MetricCard title="Средний чек" value={formatKzt(avgCheck, { compact: true })} icon={Receipt} accent="yellow" />
        <MetricCard title="Рассрочка" value={String(installmentCount)} icon={CreditCard} accent="orange" />
        <MetricCard title="Kaspi оплат" value={String(kaspiCount)} icon={CreditCard} accent="purple" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle>Список продаж</CardTitle>
            <div className="grid gap-2 sm:grid-cols-3">
              <SearchInput value={search} onChange={setSearch} placeholder="Клиент или курс…" />
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="all">Все способы</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <Select value={manager} onChange={(e) => setManager(e.target.value)}>
                <option value="all">Все менеджеры</option>
                {MANAGERS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Загрузка продаж…
              </div>
            ) : (
              <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} />
            )}
          </CardContent>
        </Card>

        {/* Receipt verification panel */}
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Проверка чеков
              <Badge variant="yellow">{pending.length} в очереди</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {active ? (
              <>
                {pending.length > 1 && (
                  <Select
                    value={active.id}
                    onChange={(e) => setActiveReceiptId(e.target.value)}
                  >
                    {pending.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.clientName} · {formatKzt(p.amount)}
                      </option>
                    ))}
                  </Select>
                )}
                <ReceiptPreview sale={active} />
                {active.receiptStatus === "pending" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setReceipt(active.id, "confirmed")}>
                      <CheckCircle2 /> Подтвердить
                    </Button>
                    <Button variant="danger" onClick={() => setReceipt(active.id, "rejected")}>
                      <XCircle /> Отклонить
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg bg-canvas p-3 text-center text-sm">
                    Чек обработан: <StatusBadge kind="receipt" value={active.receiptStatus} />
                  </div>
                )}
              </>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-10 text-brand" />
                <p className="mt-3 font-medium text-ink">Все чеки проверены</p>
                <p className="mt-1 text-sm text-muted">Нет чеков, ожидающих подтверждения</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
