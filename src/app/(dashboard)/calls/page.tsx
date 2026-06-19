"use client";

import * as React from "react";
import {
  PhoneCall,
  Play,
  Pause,
  Sparkles,
  Check,
  X as XIcon,
  ThumbsUp,
  AlertTriangle,
  Gauge,
  Languages,
  Plus,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { LANG_LABEL } from "@/lib/mock/calls";
import { fetchCalls, createCall } from "@/lib/data/calls";
import { fetchUsers } from "@/lib/data/users";
import { getRole } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/user-avatar";
import { fmtDateTime, cn } from "@/lib/utils";
import type { CallRecord, CallAnalysis, CallAnalysisChecklist, CallLanguage } from "@/lib/types";

/** Парсит транскрипт: строки «К: …» → клиент, остальное → менеджер. */
function parseTranscript(text: string): { speaker: "agent" | "client"; text: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^([^:]{1,12}):\s*(.*)$/);
      if (m) {
        const tag = m[1].toLowerCase();
        const isClient = tag.startsWith("к") || tag.includes("client") || tag.includes("clien");
        return { speaker: isClient ? ("client" as const) : ("agent" as const), text: m[2] };
      }
      return { speaker: "agent" as const, text: l };
    });
}

const CHECKLIST_LABELS: { key: keyof CallAnalysisChecklist; label: string }[] = [
  { key: "greeting", label: "Было приветствие" },
  { key: "politeTone", label: "Вежливый тон" },
  { key: "needsDiscovered", label: "Выявлена потребность" },
  { key: "coursePresented", label: "Презентован курс" },
  { key: "objectionsHandled", label: "Работа с возражениями" },
  { key: "trialOffered", label: "Предложен пробный урок" },
  { key: "nextStepFixed", label: "Зафиксирован следующий шаг" },
  { key: "properClosing", label: "Корректное завершение" },
  { key: "scriptFollowed", label: "Соблюдён скрипт" },
];

function fmtDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function scoreVariant(s: number): "green" | "yellow" | "red" {
  return s >= 75 ? "green" : s >= 55 ? "yellow" : "red";
}

export default function CallsPage() {
  return (
    <RoleBasedGuard page="calls">
      <CallsInner />
    </RoleBasedGuard>
  );
}

function CallsInner() {
  const { range } = useApp();
  const [calls, setCalls] = React.useState<CallRecord[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [langFilter, setLangFilter] = React.useState("all");
  const [playing, setPlaying] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);

  const [employees, setEmployees] = React.useState<{ id: string; name: string }[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const emptyDraft = {
    employeeId: "",
    clientName: "",
    durMin: "",
    durSec: "",
    language: "ru" as CallLanguage,
    result: "",
    transcript: "",
  };
  const [draft, setDraft] = React.useState(emptyDraft);

  React.useEffect(() => {
    let active = true;
    fetchCalls().then((rows) => {
      if (active) {
        setCalls(rows);
        setSelectedId((cur) => cur ?? rows[0]?.id ?? null);
      }
    });
    fetchUsers().then((us) => {
      if (active) {
        const list = us
          .filter((u) => u.active !== false && ["hunter", "manager", "rop"].includes(u.role))
          .map((u) => ({ id: u.id, name: u.name }));
        setEmployees(list);
        setDraft((d) => (d.employeeId ? d : { ...d, employeeId: list[0]?.id ?? "" }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreateCall() {
    if (!draft.clientName.trim() || !draft.employeeId) return;
    setSaving(true);
    const durationSec = (parseInt(draft.durMin || "0", 10) || 0) * 60 + (parseInt(draft.durSec || "0", 10) || 0);
    const call = await createCall({
      employeeId: draft.employeeId,
      clientName: draft.clientName.trim(),
      durationSec,
      language: draft.language,
      result: draft.result.trim(),
      transcript: draft.transcript.trim() ? parseTranscript(draft.transcript) : [],
    });
    setSaving(false);
    if (!call) {
      alert("⚠️ Не удалось сохранить звонок. Проверьте доступ/соединение.");
      return;
    }
    setCalls((prev) => [call, ...prev]);
    setSelectedId(call.id);
    setCreateOpen(false);
    setDraft({ ...emptyDraft, employeeId: employees[0]?.id ?? "" });
  }

  const filtered = calls.filter((c) => langFilter === "all" || c.language === langFilter);
  const selected = calls.find((c) => c.id === selectedId) ?? null;

  const analyzed = calls.filter((c) => c.status === "done");
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((s, c) => s + (c.score ?? 0), 0) / analyzed.length)
    : 0;
  const pending = calls.filter((c) => c.status !== "done").length;

  async function runAnalysis(call: CallRecord) {
    setAnalyzing(true);
    setCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, status: "analyzing" } : c)));
    let analysis: CallAnalysis | null = null;
    try {
      const res = await fetch("/api/ai/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: call.transcript }),
      });
      const data = await res.json();
      analysis = data.analysis as CallAnalysis;
    } catch {
      analysis = null;
    }
    setCalls((prev) =>
      prev.map((c) =>
        c.id === call.id
          ? { ...c, status: "done", score: analysis?.score ?? c.score, analysis: analysis ?? c.analysis }
          : c,
      ),
    );
    setAnalyzing(false);
  }

  const columns: Column<CallRecord>[] = [
    { key: "date", header: "Дата", cell: (c) => <span className="text-muted">{fmtDateTime(c.date)}</span> },
    {
      key: "emp",
      header: "Сотрудник",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={c.employeeName} size="sm" />
          <span className="font-medium">{c.employeeName}</span>
        </div>
      ),
    },
    { key: "role", header: "Роль", cell: (c) => <span className="text-muted">{getRole(c.role).short}</span> },
    { key: "client", header: "Клиент", cell: (c) => c.clientName },
    { key: "dur", header: "Длит.", cell: (c) => fmtDuration(c.durationSec) },
    { key: "lang", header: "Язык", cell: (c) => <Badge variant="gray">{LANG_LABEL[c.language]}</Badge> },
    {
      key: "status",
      header: "Анализ",
      cell: (c) =>
        c.status === "done" ? (
          <Badge variant="green">Готов</Badge>
        ) : c.status === "analyzing" ? (
          <Badge variant="yellow">Анализ…</Badge>
        ) : (
          <Badge variant="gray">Ожидает</Badge>
        ),
    },
    {
      key: "score",
      header: "Балл",
      align: "right",
      cell: (c) => (c.score != null ? <Badge variant={scoreVariant(c.score)}>{c.score}</Badge> : <span className="text-muted">—</span>),
    },
    { key: "result", header: "Результат", cell: (c) => <span className="text-muted">{c.result}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Анализ звонков" description={`AI-контроль качества разговоров · ${range.label}`}>
        <Button variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus /> Добавить звонок
        </Button>
        <ExportButton />
      </PageHeader>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый звонок"
        description="Добавьте звонок вручную. Транскрипт можно вставить для AI-анализа."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCall} disabled={saving || !draft.clientName.trim() || !draft.employeeId}>
              {saving ? "Сохранение…" : "Добавить"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Сотрудник</label>
            <Select value={draft.employeeId} onChange={(e) => setDraft({ ...draft, employeeId: e.target.value })}>
              {employees.length === 0 && <option value="">Нет сотрудников</option>}
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Клиент</label>
            <Input value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} placeholder="Имя клиента" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Минуты</label>
              <Input type="number" min="0" value={draft.durMin} onChange={(e) => setDraft({ ...draft, durMin: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Секунды</label>
              <Input type="number" min="0" max="59" value={draft.durSec} onChange={(e) => setDraft({ ...draft, durSec: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Язык</label>
              <Select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as CallLanguage })}>
                <option value="ru">Русский</option>
                <option value="kz">Казахский</option>
                <option value="mixed">Смешанный</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Результат</label>
            <Input value={draft.result} onChange={(e) => setDraft({ ...draft, result: e.target.value })} placeholder="Напр. Назначен пробный урок" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Транскрипт (необязательно)</label>
            <textarea
              value={draft.transcript}
              onChange={(e) => setDraft({ ...draft, transcript: e.target.value })}
              rows={5}
              placeholder={"М: Здравствуйте! Чем могу помочь?\nК: Хочу узнать про курсы\nМ: ..."}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand"
            />
            <p className="mt-1 text-xs text-muted">Строки «К:» — клиент, остальные — менеджер. Нужен для AI-анализа.</p>
          </div>
        </div>
      </Modal>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Всего звонков" value={String(calls.length)} icon={PhoneCall} accent="blue" />
        <MetricCard title="Проанализировано" value={String(analyzed.length)} icon={Check} accent="green" />
        <MetricCard title="Средний балл" value={String(avgScore)} icon={Gauge} accent="yellow" />
        <MetricCard title="Ожидают анализа" value={String(pending)} icon={AlertTriangle} accent="orange" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Журнал звонков</CardTitle>
            <Select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="w-40">
              <option value="all">Все языки</option>
              <option value="ru">Русский</option>
              <option value="kz">Казахский</option>
              <option value="mixed">Смешанный</option>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(c) => c.id}
              onRowClick={(c) => setSelectedId(c.id)}
              activeRowKey={selectedId ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Call detail */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Звонок
                  <Badge variant="gray"><Languages className="size-3" /> {LANG_LABEL[selected.language]}</Badge>
                </CardTitle>
                <p className="text-sm text-muted">{selected.employeeName} → {selected.clientName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock audio player */}
                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                  >
                    {playing ? <Pause className="size-4.5" /> : <Play className="size-4.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                      <div className={cn("h-full rounded-full bg-brand transition-all", playing ? "w-2/3" : "w-1/4")} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{fmtDuration(selected.durationSec)} · демо-запись</p>
                  </div>
                </div>

                {/* Run analysis */}
                {selected.status !== "done" ? (
                  <Button className="w-full" onClick={() => runAnalysis(selected)} disabled={analyzing}>
                    {selected.status === "analyzing" || analyzing ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        AI-анализ…
                      </>
                    ) : (
                      <>
                        <Sparkles /> Запустить AI-анализ
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => runAnalysis(selected)} disabled={analyzing}>
                    <Sparkles /> Переанализировать
                  </Button>
                )}

                {selected.analysis ? (
                  <>
                    {/* Score */}
                    <div className="flex items-center justify-between rounded-xl bg-canvas p-3">
                      <span className="text-sm text-muted">Общий балл</span>
                      <span className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-ink">{selected.analysis.score}</span>
                        <Badge variant={scoreVariant(selected.analysis.score)}>/ 100</Badge>
                      </span>
                    </div>

                    {/* Summary */}
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">AI summary</p>
                      <p className="text-sm text-ink">{selected.analysis.summary}</p>
                    </div>

                    {/* Checklist */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Чек-лист качества</p>
                      <ul className="space-y-1.5">
                        {CHECKLIST_LABELS.map((item) => {
                          const ok = selected.analysis!.checklist[item.key];
                          return (
                            <li key={item.key} className="flex items-center gap-2 text-sm">
                              <span className={cn("flex size-5 items-center justify-center rounded-full", ok ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600")}>
                                {ok ? <Check className="size-3.5" /> : <XIcon className="size-3.5" />}
                              </span>
                              <span className={ok ? "text-ink" : "text-muted"}>{item.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Good / improve */}
                    <div className="grid gap-2">
                      <div className="rounded-lg bg-brand-50/60 p-2.5 text-sm">
                        <p className="flex items-center gap-1.5 font-medium text-brand-700"><ThumbsUp className="size-3.5" /> Что хорошо</p>
                        <p className="mt-0.5 text-ink">{selected.analysis.good}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50/60 p-2.5 text-sm">
                        <p className="flex items-center gap-1.5 font-medium text-amber-700"><AlertTriangle className="size-3.5" /> Что улучшить</p>
                        <p className="mt-0.5 text-ink">{selected.analysis.improve}</p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Рекомендации</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
                        {selected.analysis.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="rounded-lg bg-canvas p-3 text-center text-sm text-muted">
                    Анализ ещё не запущен. Нажмите «Запустить AI-анализ».
                  </p>
                )}

                {/* Transcript */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Транскрипт</p>
                  <div className="space-y-2">
                    {selected.transcript.map((line, i) => (
                      <div key={i} className={cn("flex", line.speaker === "agent" ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                            line.speaker === "agent" ? "bg-brand-50 text-ink" : "bg-canvas text-ink",
                          )}
                        >
                          <p className="mb-0.5 text-[10px] font-medium uppercase text-muted">
                            {line.speaker === "agent" ? "Менеджер" : "Клиент"}
                          </p>
                          {line.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <PhoneCall className="mx-auto size-10 text-muted" />
                <p className="mt-3 font-medium text-ink">Выберите звонок</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
