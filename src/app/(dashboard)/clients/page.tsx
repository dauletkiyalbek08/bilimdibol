"use client";

import * as React from "react";
import { UserCheck, Wallet, GraduationCap, Repeat, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchClients, createClient } from "@/lib/data/clients";
import { employeeName, COURSES, MANAGERS } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/user-avatar";
import { formatKzt, fmtDate } from "@/lib/utils";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  return (
    <RoleBasedGuard page="clients">
      <ClientsInner />
    </RoleBasedGuard>
  );
}

function ClientsInner() {
  const { range } = useApp();
  const [search, setSearch] = React.useState("");
  const [course, setCourse] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: "",
    phone: "",
    course: COURSES[0],
    managerId: MANAGERS[0].id,
    totalPaid: "",
  });

  React.useEffect(() => {
    let active = true;
    fetchClients().then((rows) => {
      if (active) {
        setClients(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate() {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    setCreating(true);
    const client = await createClient({
      name: draft.name,
      phone: draft.phone,
      course: draft.course,
      managerId: draft.managerId,
      totalPaid: Number(draft.totalPaid) || 0,
    });
    setClients((prev) => [client, ...prev]);
    setCreating(false);
    setCreateModal(false);
    setDraft({ name: "", phone: "", course: COURSES[0], managerId: MANAGERS[0].id, totalPaid: "" });
  }

  const filtered = clients.filter((c) => {
    if (course !== "all" && c.course !== course) return false;
    if (status !== "all" && c.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    }
    return true;
  });

  const active = clients.filter((c) => c.status === "Активный").length;
  const ltv = clients.length ? Math.round(clients.reduce((s, c) => s + c.totalPaid, 0) / clients.length) : 0;
  const completed = clients.filter((c) => c.status === "Завершил").length;

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Клиент",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={c.name} size="sm" />
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted">{c.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "course", header: "Курс", cell: (c) => c.course },
    { key: "manager", header: "Менеджер", cell: (c) => employeeName(c.managerId) },
    {
      key: "progress",
      header: "Прогресс",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-brand" style={{ width: `${c.progress}%` }} />
          </div>
          <span className="text-xs text-muted">{c.progress}%</span>
        </div>
      ),
    },
    { key: "total", header: "Оплачено", align: "right", cell: (c) => <span className="font-semibold">{formatKzt(c.totalPaid)}</span> },
    { key: "status", header: "Статус", cell: (c) => <StatusBadge kind="generic" value={c.status} /> },
    { key: "joined", header: "С нами с", cell: (c) => <span className="text-muted">{fmtDate(c.joinedAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Клиенты" description={`База клиентов · ${filtered.length} из ${clients.length} · ${range.label}`}>
        <Button onClick={() => setCreateModal(true)}>
          <Plus /> Новый клиент
        </Button>
        <ExportButton />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Всего клиентов" value={String(clients.length)} icon={UserCheck} accent="green" />
        <MetricCard title="Активных" value={String(active)} icon={GraduationCap} accent="blue" />
        <MetricCard title="Завершили курс" value={String(completed)} icon={Repeat} accent="purple" />
        <MetricCard title="Средний LTV" value={formatKzt(ltv, { compact: true })} icon={Wallet} accent="yellow" />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>База клиентов</CardTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Имя или телефон…" />
            <Select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="all">Все курсы</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Все статусы</option>
              <option>Активный</option>
              <option>Завершил</option>
              <option>Пауза</option>
              <option>Возврат</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
              <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              Загрузка клиентов…
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(c) => c.id} emptyTitle="Клиенты не найдены" />
          )}
        </CardContent>
      </Card>

      {/* Create client modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Новый клиент"
        description="Добавить клиента в базу"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={creating || !draft.name.trim() || !draft.phone.trim()}>
              {creating ? "Сохранение…" : "Создать клиента"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Имя клиента *</label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Напр. Алия А." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Телефон *</label>
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+7 701 …" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Оплачено (₸)</label>
            <Input type="number" value={draft.totalPaid} onChange={(e) => setDraft({ ...draft, totalPaid: e.target.value })} placeholder="159000" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Курс</label>
            <Select value={draft.course} onChange={(e) => setDraft({ ...draft, course: e.target.value })}>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Менеджер</label>
            <Select value={draft.managerId} onChange={(e) => setDraft({ ...draft, managerId: e.target.value })}>
              {MANAGERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
