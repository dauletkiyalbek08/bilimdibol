"use client";

import * as React from "react";
import {
  Instagram,
  Sparkles,
  Plus,
  CheckCircle2,
  Lightbulb,
  CalendarDays,
  Megaphone,
  Film,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { SMM_FORMATS, SMM_STATUS_LABEL, generateIdeas } from "@/lib/mock/smm";
import { fetchContentPlan } from "@/lib/data/smm";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { DataTable, type Column } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { fmtDate, cn } from "@/lib/utils";
import type { SmmContentIdea, SmmContentPlanItem, SmmFormat, SmmStatus } from "@/lib/types";

export default function SmmPage() {
  return (
    <RoleBasedGuard page="smm">
      <SmmInner />
    </RoleBasedGuard>
  );
}

function SmmInner() {
  const { range } = useApp();
  const [format, setFormat] = React.useState<SmmFormat>("Reels");
  const [topic, setTopic] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [ideas, setIdeas] = React.useState<SmmContentIdea[]>([]);
  const [plan, setPlan] = React.useState<SmmContentPlanItem[]>([]);

  React.useEffect(() => {
    let active = true;
    fetchContentPlan().then((rows) => {
      if (active) setPlan(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  function generate() {
    setGenerating(true);
    window.setTimeout(() => {
      setIdeas(generateIdeas(format, topic, 4));
      setGenerating(false);
    }, 700);
  }

  function addToPlan(idea: SmmContentIdea) {
    setPlan((prev) => [
      {
        id: `plan-${Date.now()}`,
        topic: idea.topic,
        format: idea.format,
        rubric: idea.rubric,
        goal: idea.goal,
        cta: idea.cta,
        status: "planned",
        publishDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
      ...prev,
    ]);
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
  }

  function markPublished(id: string) {
    setPlan((prev) => prev.map((p) => (p.id === id ? { ...p, status: "published" as SmmStatus } : p)));
  }

  const published = plan.filter((p) => p.status === "published").length;
  const planned = plan.filter((p) => p.status === "planned" || p.status === "in_progress").length;

  const columns: Column<SmmContentPlanItem>[] = [
    { key: "topic", header: "Тема", cell: (p) => <span className="font-medium">{p.topic}</span> },
    { key: "format", header: "Формат", cell: (p) => <Badge variant="gray">{p.format}</Badge> },
    { key: "rubric", header: "Рубрика", cell: (p) => <span className="text-muted">{p.rubric}</span> },
    { key: "goal", header: "Цель", cell: (p) => <span className="text-muted">{p.goal}</span> },
    { key: "cta", header: "CTA", cell: (p) => <span className="block max-w-[200px] truncate text-muted">{p.cta}</span> },
    {
      key: "status",
      header: "Статус",
      cell: (p) => <Badge variant={SMM_STATUS_LABEL[p.status].variant as BadgeProps["variant"]}>{SMM_STATUS_LABEL[p.status].label}</Badge>,
    },
    { key: "date", header: "Дата", cell: (p) => <span className="text-muted">{fmtDate(p.publishDate)}</span> },
    {
      key: "action",
      header: "",
      cell: (p) =>
        p.status !== "published" ? (
          <Button variant="ghost" size="sm" onClick={() => markPublished(p.id)}>
            <CheckCircle2 /> Опубликовано
          </Button>
        ) : (
          <span className="text-xs text-brand-700">✓ Опубликовано</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="SMM Studio" description={`Идеи контента и контент-план · ${range.label}`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Постов в плане" value={String(plan.length)} icon={CalendarDays} accent="blue" />
        <MetricCard title="Запланировано" value={String(planned)} icon={Lightbulb} accent="yellow" />
        <MetricCard title="Опубликовано" value={String(published)} icon={CheckCircle2} accent="green" />
        <MetricCard title="Идей сгенерировано" value={String(ideas.length)} icon={Sparkles} accent="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* Generator */}
        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4.5 text-brand" /> Генератор идей</CardTitle>
            <CardDescription>Идеи для постов, stories и reels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Формат</label>
              <div className="grid grid-cols-2 gap-2">
                {SMM_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
                      format === f ? "border-brand bg-brand-50 text-brand-700" : "border-border text-ink hover:bg-canvas",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Тема (необязательно)</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="например, IELTS Speaking" />
            </div>
            <Button className="w-full" onClick={generate} disabled={generating}>
              {generating ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Генерируем…
                </>
              ) : (
                <>
                  <Sparkles /> Сгенерировать идеи
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated ideas */}
        <div className="space-y-4">
          {ideas.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {ideas.map((idea) => (
                <Card key={idea.id}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple">{idea.format}</Badge>
                      <Badge variant="gray">{idea.rubric}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-ink">{idea.topic}</p>
                    <p className="text-xs text-muted"><span className="font-medium text-ink">Хук:</span> {idea.hook}</p>
                    <p className="text-xs text-muted"><span className="font-medium text-ink">Цель:</span> {idea.goal}</p>
                    <p className="text-xs text-muted"><span className="font-medium text-ink">CTA:</span> {idea.cta}</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => addToPlan(idea)}>
                      <Plus /> Добавить в контент-план
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Film className="size-9 text-muted" />
                <p className="mt-3 font-medium text-ink">Идеи появятся здесь</p>
                <p className="mt-1 text-sm text-muted">Выберите формат и нажмите «Сгенерировать идеи»</p>
              </CardContent>
            </Card>
          )}

          {/* Quick idea bank */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="size-4.5 text-brand" /> Прогревы и рубрики</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Польза", "Кейс ученика", "Прогрев", "Развлекательное", "Оффер", "За кадром", "Отзыв", "Опрос в Stories"].map((r) => (
                  <span key={r} className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink">
                    <Instagram className="size-3.5 text-brand" /> {r}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content plan */}
      <Card>
        <CardHeader>
          <CardTitle>Контент-план</CardTitle>
          <CardDescription>Публикации и их статусы</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={plan} rowKey={(p) => p.id} />
        </CardContent>
      </Card>
    </div>
  );
}
