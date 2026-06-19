"use client";

import * as React from "react";
import {
  Phone,
  Mail,
  Instagram,
  MessageSquarePlus,
  CalendarPlus,
  RefreshCw,
  X,
  Clock,
  Plus,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fetchLeads, updateLeadStatus, updateLeadComment, createLead, updateLeadHunter, deleteLead } from "@/lib/data/leads";
import { HUNTERS, employeeName, SOURCES } from "@/lib/mock-data";
import { fetchUsers } from "@/lib/data/users";
import { LEAD_MAP } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { UserAvatar } from "@/components/user-avatar";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/types";

export default function LeadsPage() {
  return (
    <RoleBasedGuard page="leads">
      <LeadsInner />
    </RoleBasedGuard>
  );
}

function LeadsInner() {
  const { range, role } = useApp();
  const canManageLeads = role === "admin" || role === "rop";
  const [status, setStatus] = React.useState<string>("all");
  const [source, setSource] = React.useState<string>("all");
  const [hunter, setHunter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  // Loaded from Supabase when configured, otherwise mock. Mutations are kept
  // in local state and (when configured) persisted to the backend.
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [hunterList, setHunterList] = React.useState<{ id: string; name: string }[]>(
    HUNTERS.map((h) => ({ id: h.id, name: h.name })),
  );

  React.useEffect(() => {
    let active = true;
    fetchLeads().then((rows) => {
      if (active) {
        setLeads(rows);
        setLoading(false);
      }
    });
    fetchUsers().then((us) => {
      if (active) {
        const hs = us.filter((u) => u.role === "hunter" && u.active !== false).map((u) => ({ id: u.id, name: u.name }));
        if (hs.length) setHunterList(hs);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const [statusModal, setStatusModal] = React.useState(false);
  const [commentModal, setCommentModal] = React.useState(false);
  const [trialModal, setTrialModal] = React.useState(false);
  const [createModal, setCreateModal] = React.useState(false);
  const [hunterModal, setHunterModal] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: "",
    phone: "",
    source: SOURCES[0],
    hunterId: HUNTERS[0].id,
    comment: "",
  });

  const filtered = leads.filter((l) => {
    if (status !== "all" && l.status !== status) return false;
    if (source !== "all" && l.source !== source) return false;
    if (hunter !== "all" && l.hunterId !== hunter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.phone.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  function changeStatus(id: string, next: LeadStatus) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: next,
              history: [
                { date: new Date().toISOString(), author: employeeName(l.hunterId), text: `Статус изменён на «${LEAD_MAP[next].label}»` },
                ...l.history,
              ],
            }
          : l,
      ),
    );
    setStatusModal(false);
    updateLeadStatus(id, next).then((ok) => {
      if (!ok) {
        alert("⚠️ Не удалось сохранить статус. Проверьте доступ/соединение — данные обновлены из базы.");
        fetchLeads().then(setLeads);
      }
    });
  }

  function reassignHunter(id: string, hunterId: string) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              hunterId,
              history: [
                { date: new Date().toISOString(), author: "Руководитель", text: `Лид переназначен на ${employeeName(hunterId)}` },
                ...l.history,
              ],
            }
          : l,
      ),
    );
    setHunterModal(false);
    updateLeadHunter(id, hunterId).then((ok) => {
      if (!ok) {
        alert("⚠️ Не удалось переназначить хантера. Проверьте доступ/соединение — данные обновлены из базы.");
        fetchLeads().then(setLeads);
      }
    });
  }

  function removeLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelectedId(null);
    setDeleteModal(false);
    deleteLead(id).then((ok) => {
      if (!ok) {
        alert("⚠️ Не удалось удалить лид. Проверьте доступ/соединение — данные обновлены из базы.");
        fetchLeads().then(setLeads);
      }
    });
  }

  function addComment(id: string, text: string) {
    if (!text.trim()) return;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              comment: text,
              history: [
                { date: new Date().toISOString(), author: employeeName(l.hunterId), text: `Комментарий: ${text}` },
                ...l.history,
              ],
            }
          : l,
      ),
    );
    setCommentDraft("");
    setCommentModal(false);
    updateLeadComment(id, text).then((ok) => {
      if (!ok) {
        alert("⚠️ Не удалось сохранить комментарий. Проверьте доступ/соединение — данные обновлены из базы.");
        fetchLeads().then(setLeads);
      }
    });
  }

  async function handleCreate() {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    setCreating(true);
    const lead = await createLead(draft);
    setLeads((prev) => [lead, ...prev]);
    setSelectedId(lead.id);
    setCreating(false);
    setCreateModal(false);
    setDraft({ name: "", phone: "", source: SOURCES[0], hunterId: HUNTERS[0].id, comment: "" });
  }

  function assignTrial(id: string) {
    changeStatus(id, "bought_trial");
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              history: [
                { date: new Date().toISOString(), author: employeeName(l.hunterId), text: "Назначен пробный урок" },
                ...l.history,
              ],
            }
          : l,
      ),
    );
    setTrialModal(false);
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Клиент",
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={l.name} size="sm" />
          <span className="font-medium">{l.name}</span>
        </div>
      ),
    },
    { key: "phone", header: "Телефон", cell: (l) => <span className="text-muted">{l.phone}</span> },
    { key: "source", header: "Источник", cell: (l) => l.source },
    { key: "hunter", header: "Hunter", cell: (l) => employeeName(l.hunterId) },
    { key: "status", header: "Статус", cell: (l) => <StatusBadge kind="lead" value={l.status} /> },
    { key: "created", header: "Заявка", cell: (l) => <span className="text-muted">{fmtDate(l.createdAt)}</span> },
    {
      key: "next",
      header: "Касание",
      cell: (l) =>
        l.nextTouch ? (
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="size-3.5" /> {fmtDate(l.nextTouch)}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { key: "comment", header: "Комментарий", cell: (l) => <span className="block max-w-[200px] truncate text-muted">{l.comment}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Лиды" description={`CRM · ${filtered.length} лидов · ${range.label}`}>
        <Button onClick={() => setCreateModal(true)}>
          <Plus /> Новый лид
        </Button>
        <ExportButton />
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Имя или телефон…" className="lg:col-span-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Все статусы</option>
            {Object.entries(LEAD_MAP).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </Select>
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="all">Все источники</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={hunter} onChange={(e) => setHunter(e.target.value)}>
            <option value="all">Все Hunter-ы</option>
            {HUNTERS.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setStatus("all");
              setSource("all");
              setHunter("all");
              setSearch("");
            }}
          >
            <RefreshCw /> Сбросить
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Загрузка лидов…
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                rowKey={(l) => l.id}
                onRowClick={(l) => setSelectedId(l.id)}
                activeRowKey={selectedId ?? undefined}
                emptyTitle="Лиды не найдены"
              />
            )}
          </CardContent>
        </Card>

        {/* Lead detail card */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <Card>
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selected.name} size="lg" />
                  <div>
                    <p className="font-semibold text-ink">{selected.name}</p>
                    <StatusBadge kind="lead" value={selected.status} />
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded-lg p-1 text-muted hover:bg-canvas">
                  <X className="size-4" />
                </button>
              </div>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <ContactRow icon={Phone} value={selected.phone} />
                  <ContactRow icon={Mail} value={selected.email ?? "—"} />
                  <ContactRow icon={Instagram} value={selected.instagram ?? "—"} />
                </div>

                <div className="rounded-xl bg-canvas p-3 text-sm">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Комментарий</p>
                  <p className="text-ink">{selected.comment}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={() => setTrialModal(true)}>
                    <CalendarPlus /> Назначить пробный урок
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setStatusModal(true)}>
                      <RefreshCw /> Сменить статус
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCommentDraft(selected.comment);
                        setCommentModal(true);
                      }}
                    >
                      <MessageSquarePlus /> Комментарий
                    </Button>
                  </div>
                  {canManageLeads && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setHunterModal(true)}>
                        <ArrowRightLeft /> Сменить хантера
                      </Button>
                      <Button variant="danger" onClick={() => setDeleteModal(true)}>
                        <Trash2 /> Удалить лид
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">История взаимодействий</p>
                  <ol className="space-y-3 border-l border-border pl-4">
                    {selected.history.map((h, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-brand ring-4 ring-brand-50" />
                        <p className="text-sm text-ink">{h.text}</p>
                        <p className="text-xs text-muted">{h.author} · {fmtDateTime(h.date)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-full flex-col items-center justify-center py-16 text-center">
                <UserAvatar name="? ?" size="lg" className="bg-border" />
                <p className="mt-3 font-medium text-ink">Выберите лид</p>
                <p className="mt-1 text-sm text-muted">Нажмите на строку, чтобы открыть карточку</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create lead modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Новый лид"
        description="Добавить лид в CRM"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={creating || !draft.name.trim() || !draft.phone.trim()}>
              {creating ? "Сохранение…" : "Создать лид"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Имя клиента *</label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Напр. Алишер А." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Телефон *</label>
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+7 701 …" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Источник</label>
            <Select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as typeof draft.source })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Hunter</label>
            <Select value={draft.hunterId} onChange={(e) => setDraft({ ...draft, hunterId: e.target.value })}>
              {HUNTERS.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted">Комментарий</label>
            <Input value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} placeholder="Что интересует…" />
          </div>
        </div>
      </Modal>

      {/* Reassign hunter modal */}
      {selected && (
        <Modal open={hunterModal} onClose={() => setHunterModal(false)} title="Сменить хантера" description={selected.name}>
          <div className="grid grid-cols-2 gap-2">
            {hunterList.map((h) => (
              <button
                key={h.id}
                onClick={() => reassignHunter(selected.id, h.id)}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:border-brand hover:bg-brand-50"
              >
                {h.name}
                {selected.hunterId === h.id && <span className="text-xs text-brand">текущий</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Delete lead modal */}
      {selected && (
        <Modal
          open={deleteModal}
          onClose={() => setDeleteModal(false)}
          title="Удалить лид?"
          description={`${selected.name} · ${selected.phone}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteModal(false)}>Отмена</Button>
              <Button variant="danger" onClick={() => removeLead(selected.id)}>
                <Trash2 /> Удалить
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Лид и связанная сделка будут удалены без возможности восстановления.
          </p>
        </Modal>
      )}

      {/* Status modal */}
      {selected && (
        <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Сменить статус лида" description={selected.name}>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(LEAD_MAP).map(([key, v]) => (
              <button
                key={key}
                onClick={() => changeStatus(selected.id, key as LeadStatus)}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:border-brand hover:bg-brand-50"
              >
                {v.label}
                {selected.status === key && <span className="text-xs text-brand">текущий</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Comment modal */}
      {selected && (
        <Modal
          open={commentModal}
          onClose={() => setCommentModal(false)}
          title="Добавить комментарий"
          description={selected.name}
          footer={
            <>
              <Button variant="ghost" onClick={() => setCommentModal(false)}>Отмена</Button>
              <Button onClick={() => addComment(selected.id, commentDraft)}>Сохранить</Button>
            </>
          }
        >
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            rows={4}
            placeholder="Введите комментарий…"
            className="w-full rounded-lg border border-border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
        </Modal>
      )}

      {/* Trial modal */}
      {selected && (
        <Modal
          open={trialModal}
          onClose={() => setTrialModal(false)}
          title="Назначить пробный урок"
          description={selected.name}
          footer={
            <>
              <Button variant="ghost" onClick={() => setTrialModal(false)}>Отмена</Button>
              <Button onClick={() => assignTrial(selected.id)}>
                <CalendarPlus /> Назначить
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Дата</label>
              <Input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Время</label>
              <Input type="time" defaultValue="14:00" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted">Менеджер / Учитель</label>
              <Select defaultValue="">
                <option value="">Выберите менеджера</option>
                <option>Салтанат Ж.</option>
                <option>Айна Б.</option>
              </Select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ContactRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-lg bg-canvas text-muted">
        <Icon className="size-3.5" />
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
