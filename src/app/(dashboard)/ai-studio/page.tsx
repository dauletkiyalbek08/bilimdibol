"use client";

import * as React from "react";
import { Sparkles, Wand2, Film, Pencil, Download, User, Clapperboard } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { AiStudioScene } from "@/lib/types";

const FORMATS = ["Reels", "TikTok", "Stories", "YouTube Shorts"] as const;
const DURATIONS = [15, 30, 60] as const;
const STYLES = ["Динамичный / трендовый", "Образовательный", "Сторителлинг", "UGC / разговорный"];

const CHARACTER = "Аружан — энергичная преподавательница английского";

function buildScenes(opts: {
  format: string;
  duration: number;
  count: number;
  style: string;
  cta: string;
  consistent: boolean;
}): AiStudioScene[] {
  const hero = opts.consistent ? CHARACTER : "Разные персонажи в каждом ролике";
  const per = Math.round(opts.duration / 1);
  const beats = [
    {
      title: "Видео 1 — Хук и проблема",
      script: `${hero} начинает: «Учишь английский годами, а заговорить не можешь?» Резкий хук в первые 2 секунды, крупный план, динамичный монтаж в стиле «${opts.style}».`,
      visual: "Крупный план героя, текст-хук на экране, быстрый зум",
    },
    {
      title: "Видео 2 — Инсайт и метод",
      script: `Та же ${opts.consistent ? "героиня" : "история"} раскрывает метод bilimdibol: speaking-first подход. Показываем мини-демо урока и реакцию ученика.`,
      visual: "Сцена урока, разделение экрана «до / после», субтитры",
    },
    {
      title: "Видео 3 — Доказательство и эмоция",
      script: `История успеха: ученик сдал IELTS на 7.0. ${opts.consistent ? "Героиня" : "Рассказчик"} комментирует результат, появляются отзывы и цифры.`,
      visual: "Отзывы, скриншоты результатов, эмоциональный момент",
    },
    {
      title: "Видео 4 — Оффер и CTA",
      script: `Финал серии: ${opts.consistent ? "та же героиня" : "новый кадр"} приглашает на пробный урок. Чёткий призыв: «${opts.cta}». Логотип bilimdibol в конце.`,
      visual: "Оффер крупно, кнопка CTA, брендинг bilimdibol",
    },
  ];
  return Array.from({ length: opts.count }).map((_, i) => ({
    index: i + 1,
    title: beats[i % beats.length].title,
    script: beats[i % beats.length].script,
    visual: beats[i % beats.length].visual,
    duration: per,
  }));
}

export default function AiStudioPage() {
  return (
    <RoleBasedGuard page="ai-studio">
      <AiStudioInner />
    </RoleBasedGuard>
  );
}

function AiStudioInner() {
  const { range } = useApp();
  const [format, setFormat] = React.useState<(typeof FORMATS)[number]>("Reels");
  const [duration, setDuration] = React.useState<(typeof DURATIONS)[number]>(30);
  const [count, setCount] = React.useState(4);
  const [consistent, setConsistent] = React.useState(true);
  const [style, setStyle] = React.useState(STYLES[0]);
  const [cta, setCta] = React.useState("Запишись на бесплатный пробный урок");
  const [generating, setGenerating] = React.useState(false);
  const [scenes, setScenes] = React.useState<AiStudioScene[] | null>(null);

  function generate() {
    setGenerating(true);
    window.setTimeout(() => {
      setScenes(buildScenes({ format, duration, count, style, cta, consistent }));
      setGenerating(false);
    }, 900);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Studio" description={`Генерация связанных видеосерий · ${range.label}`}>
        <Badge variant="purple"><Sparkles className="size-3" /> Beta · демо-режим</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Generator panel */}
        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 className="size-4.5 text-brand" /> Параметры генерации</CardTitle>
            <CardDescription>Настройте серию из связанных роликов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Формат</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      format === f ? "border-brand bg-brand-50 text-brand-700" : "border-border text-ink hover:bg-canvas",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Длительность</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      duration === d ? "border-brand bg-brand-50 text-brand-700" : "border-border text-ink hover:bg-canvas",
                    )}
                  >
                    {d} сек
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Количество связанных видео</label>
              <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} видео</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Один персонаж во всех видео</p>
                  <p className="text-xs text-muted">Сохранять героя между роликами</p>
                </div>
              </div>
              <Switch checked={consistent} onCheckedChange={setConsistent} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Стиль</label>
              <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">CTA (призыв к действию)</label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} />
            </div>

            <Button className="w-full" onClick={generate} disabled={generating}>
              {generating ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Генерируем…
                </>
              ) : (
                <>
                  <Sparkles /> Сгенерировать сценарий
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output panel */}
        <div className="space-y-4">
          {!scenes ? (
            <Card>
              <EmptyState
                icon={Clapperboard}
                title="Сценарий ещё не сгенерирован"
                description="Настройте параметры слева и нажмите «Сгенерировать сценарий», чтобы получить связанную серию роликов с единым персонажем."
              />
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Сценарий видеосерии</CardTitle>
                    <CardDescription>
                      {format} · {duration} сек · {count} видео {consistent && "· единый персонаж"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Pencil /> Редактировать</Button>
                    <Button variant="outline" size="sm"><Download /> Экспорт</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl bg-canvas p-4 text-sm">
                    <p className="font-medium text-ink">Концепция серии</p>
                    <p className="mt-1 text-muted">
                      Связная история из {count} роликов формата {format}. {consistent
                        ? `Главный герой — ${CHARACTER} — проходит через всю серию, обеспечивая узнаваемость бренда.`
                        : "В каждом ролике своя подача, объединённая общим оффером bilimdibol."}{" "}
                      Финальный призыв: «{cta}».
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Film className="size-4.5 text-brand" /> Storyboard</CardTitle>
                  <CardDescription>Раскадровка связанных видео</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {scenes.map((s) => (
                      <div key={s.index} className="overflow-hidden rounded-xl border border-border">
                        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-brand-700 to-brand">
                          <span className="absolute left-2 top-2 rounded-md bg-black/30 px-1.5 py-0.5 text-xs font-medium text-white">
                            #{s.index} · {s.duration}с
                          </span>
                          {consistent && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-accent-yellow px-1.5 py-0.5 text-[10px] font-bold text-ink">
                              <User className="size-3" /> Тот же герой
                            </span>
                          )}
                          <Film className="size-8 text-white/60" />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-ink">{s.title}</p>
                          <p className="mt-1 text-xs text-muted">{s.script}</p>
                          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-700">
                            <Clapperboard className="size-3" /> {s.visual}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
