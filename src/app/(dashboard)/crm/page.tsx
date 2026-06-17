"use client";

import * as React from "react";
import {
  Phone,
  Flame,
  Snowflake,
  Sun,
  X,
  Plus,
  MessageSquarePlus,
  ArrowRightLeft,
  CheckSquare,
  ListChecks,
  PhoneCall,
  MessageCircle,
  FileSignature,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { DEAL_STAGES, employeeName } from "@/lib/mock/crm";
import { fetchDeals, updateDealStage } from "@/lib/data/deals";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { formatKzt, fmtDate, fmtDateTime, cn } from "@/lib/utils";
import type { Deal, DealStage, LeadQuality } from "@/lib/types";

const QUALITY_META: Record<LeadQuality, { label: string; icon: React.ElementType; variant: "red" | "yellow" | "blue" }> = {
  hot: { label: "Горячий", icon: Flame, variant: "red" },
  warm: { label: "Тёплый", icon: Sun, variant: "yellow" },
  cold: { label: "Холодный", icon: Snowflake, variant: "blue" },
};

export default function CrmPage() {
  return (
    <RoleBasedGuard page="crm">
      <CrmInner />
    </RoleBasedGuard>
  );
}

function CrmInner() {
  const { range } = useApp();
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchDeals().then((rows) => {
      if (active) {
        setDeals(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const [stageModal, setStageModal] = React.useState(false);
  const [taskModal, setTaskModal] = React.useState(false);
  const [commentModal, setCommentModal] = React.useState(false);
  const [taskDraft, setTaskDraft] = React.useState("");
  const [commentDraft, setCommentDraft] = React.useState("");

  const selected = deals.find((d) => d.id === selectedId) ?? null;

  const totalValue = deals
    .filter((d) => d.stage !== "lost")
    .reduce((s, d) => s + d.amount * (d.probability / 100), 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.amount, 0);

  function moveStage(id: string, stage: DealStage) {
    const label = DEAL_STAGES.find((s) => s.id === stage)?.label ?? stage;
    const prob = stage === "won" ? 100 : stage === "lost" ? 0 : undefined;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              stage,
              probability: prob ?? d.probability,
              history: [
                { date: new Date().toISOString(), author: employeeName(d.hunterId), text: `Этап изменён на «${label}»` },
                ...d.history,
              ],
            }
          : d,
      ),
    );
    void updateDealStage(id, stage); // persists to Supabase when configured
    setStageModal(false);
  }

  function addTask(id: string, title: string) {
    if (!title.trim()) return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              tasks: [{ id: `t-${Date.now()}`, title, due: new Date().toISOString(), done: false }, ...d.tasks],
              history: [
                { date: new Date().toISOString(), author: employeeName(d.hunterId), text: `Задача: ${title}` },
                ...d.history,
              ],
            }
          : d,
      ),
    );
    setTaskDraft("");
    setTaskModal(false);
  }

  function addComment(id: string, text: string) {
    if (!text.trim()) return;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              comment: text,
              history: [
                { date: new Date().toISOString(), author: employeeName(d.hunterId), text: `Комментарий: ${text}` },
                ...d.history,
              ],
            }
          : d,
      ),
    );
    setCommentDraft("");
    setCommentModal(false);
  }

  function toggleTask(dealId: string, taskId: string) {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : d,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="CRM Воронка" description={`Внутренний аналог amoCRM · ${range.label}`}>
        <Badge variant="green" className="gap-1">
          <TrendingUp className="size-3.5" /> Прогноз: {formatKzt(totalValue, { compact: true })}
        </Badge>
        <Badge variant="blue">Закрыто: {formatKzt(wonValue, { compact: true })}</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Kanban board */}
        <div className="overflow-x-auto pb-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
              <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              Загрузка сделок…
            </div>
          )}
          <div className={loading ? "hidden" : "flex min-w-max gap-3"}>
            {DEAL_STAGES.map((stage) => {
              const items = deals.filter((d) => d.stage === stage.id);
              const sum = items.reduce((s, d) => s + d.amount, 0);
              return (
                <div key={stage.id} className="w-64 shrink-0">
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-soft">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.accent }} />
                      <span className="text-sm font-semibold text-ink">{stage.label}</span>
                    </div>
                    <Badge variant="gray">{items.length}</Badge>
                  </div>
                  <p className="mb-2 px-1 text-xs text-muted">{formatKzt(sum, { compact: true })}</p>
                  <div className="space-y-2">
                    {items.map((d) => {
                      const q = QUALITY_META[d.quality];
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedId(d.id)}
                          className={cn(
                            "w-full rounded-xl border bg-white p-3 text-left shadow-soft transition-all hover:shadow-card",
                            selectedId === d.id ? "border-brand ring-1 ring-brand/30" : "border-border",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm font-medium text-ink">{d.clientName}</span>
                            <q.icon className={cn("size-3.5", q.variant === "red" ? "text-red-500" : q.variant === "yellow" ? "text-amber-500" : "text-sky-500")} />
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-brand-700">{formatKzt(d.amount, { compact: true })}</p>
                          <p className="mt-1 truncate text-xs text-muted">{d.nextStep}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                              <UserAvatar name={employeeName(d.hunterId)} size="sm" className="size-5 text-[9px]" />
                              {d.source}
                            </span>
                            <span className="text-[11px] font-medium text-muted">{d.probability}%</span>
                          </div>
                        </button>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                        Пусто
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal detail panel */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <Card>
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selected.clientName} size="lg" />
                  <div>
                    <p className="font-semibold text-ink">{selected.clientName}</p>
                    <p className="text-sm font-medium text-brand-700">{formatKzt(selected.amount)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="rounded-lg p-1 text-muted hover:bg-canvas">
                  <X className="size-4" />
                </button>
              </div>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="gray">{DEAL_STAGES.find((s) => s.id === selected.stage)?.label}</Badge>
                  <Badge variant={QUALITY_META[selected.quality].variant}>{QUALITY_META[selected.quality].label}</Badge>
                  <Badge variant="green">Вероятность {selected.probability}%</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <Row icon={Phone} label="Телефон" value={selected.phone} />
                  <Row label="Источник" value={selected.source} />
                  <Row label="UTM" value={selected.utmCampaign ?? "—"} />
                  <Row label="Креатив" value={selected.creativeId ?? "—"} />
                  <Row icon={PhoneCall} label="Hunter" value={employeeName(selected.hunterId)} />
                  <Row label="Менеджер" value={employeeName(selected.managerId)} />
                  <Row icon={FileSignature} label="Договор" value={selected.contractStatus} />
                  <Row icon={Receipt} label="Чек" value={selected.receiptStatus} />
                  <Row label="Следующий шаг" value={selected.nextStep} />
                  <Row label="Дата касания" value={selected.nextTouch ? fmtDate(selected.nextTouch) : "—"} />
                </div>

                <div className="rounded-xl bg-canvas p-3 text-sm">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Комментарий</p>
                  <p className="text-ink">{selected.comment}</p>
                </div>

                <div className="grid gap-2">
                  <Button onClick={() => setStageModal(true)}>
                    <ArrowRightLeft /> Сменить этап
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setTaskModal(true)}>
                      <CheckSquare /> Задача
                    </Button>
                    <Button variant="outline" onClick={() => { setCommentDraft(selected.comment); setCommentModal(true); }}>
                      <MessageSquarePlus /> Комментарий
                    </Button>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    <ListChecks className="size-3.5" /> Задачи
                  </p>
                  <div className="space-y-1.5">
                    {selected.tasks.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(selected.id, t.id)} className="accent-brand" />
                        <span className={cn("flex-1", t.done && "text-muted line-through")}>{t.title}</span>
                        <span className="text-xs text-muted">{fmtDate(t.due)}</span>
                      </label>
                    ))}
                    {selected.tasks.length === 0 && <p className="text-sm text-muted">Нет задач</p>}
                  </div>
                </div>

                {/* History — interactions / calls / messages */}
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    <MessageCircle className="size-3.5" /> История взаимодействий
                  </p>
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
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <UserAvatar name="? ?" size="lg" className="bg-border" />
                <p className="mt-3 font-medium text-ink">Выберите сделку</p>
                <p className="mt-1 text-sm text-muted">Кликните карточку в воронке</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stage modal */}
      {selected && (
        <Modal open={stageModal} onClose={() => setStageModal(false)} title="Сменить этап сделки" description={selected.clientName}>
          <div className="grid grid-cols-2 gap-2">
            {DEAL_STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => moveStage(selected.id, s.id)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:border-brand hover:bg-brand-50"
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: s.accent }} />
                <span className="flex-1">{s.label}</span>
                {selected.stage === s.id && <span className="text-xs text-brand">текущий</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Task modal */}
      {selected && (
        <Modal
          open={taskModal}
          onClose={() => setTaskModal(false)}
          title="Добавить задачу"
          description={selected.clientName}
          footer={
            <>
              <Button variant="ghost" onClick={() => setTaskModal(false)}>Отмена</Button>
              <Button onClick={() => addTask(selected.id, taskDraft)}><Plus /> Добавить</Button>
            </>
          }
        >
          <Input value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} placeholder="Например: перезвонить в 15:00" />
        </Modal>
      )}

      {/* Comment modal */}
      {selected && (
        <Modal
          open={commentModal}
          onClose={() => setCommentModal(false)}
          title="Добавить комментарий"
          description={selected.clientName}
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
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-muted">
        {Icon && <Icon className="size-3.5" />} {label}
      </span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
