"use client";

import * as React from "react";
import {
  BarChart3,
  Crown,
  ShoppingCart,
  Megaphone,
  Target,
  Presentation,
  Wallet,
  Banknote,
  GraduationCap,
  Workflow,
  FileText,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PRESET_ORDER, PRESET_LABELS } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportType } from "@/lib/types";

const REPORT_TYPES: { type: ReportType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "director", label: "Отчёт директора", icon: Crown, desc: "Сводка по всей компании" },
  { type: "sales", label: "Продажи", icon: ShoppingCart, desc: "Выручка, сделки, чеки" },
  { type: "advertising", label: "Реклама", icon: Megaphone, desc: "Расходы, CPL, ROMI" },
  { type: "hunters", label: "Hunter-ы", icon: Target, desc: "Лиды и конверсия" },
  { type: "managers", label: "Менеджеры", icon: Presentation, desc: "Уроки и продажи" },
  { type: "finance", label: "Финансы", icon: Wallet, desc: "Доходы и расходы" },
  { type: "payroll", label: "Зарплаты", icon: Banknote, desc: "Начисления и бонусы" },
  { type: "trials", label: "Пробные уроки", icon: GraduationCap, desc: "Назначено и проведено" },
  { type: "funnels", label: "Воронки", icon: Workflow, desc: "Конверсия воронок" },
];

export default function ReportsPage() {
  return (
    <RoleBasedGuard page="reports">
      <ReportsInner />
    </RoleBasedGuard>
  );
}

function ReportsInner() {
  const { range, setPreset } = useApp();
  const [type, setType] = React.useState<ReportType>("director");
  const [generated, setGenerated] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const selectedMeta = REPORT_TYPES.find((r) => r.type === type)!;

  function generate() {
    setGenerating(true);
    setGenerated(false);
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Отчёты" description="Сформируйте и выгрузите отчёт за период" />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Тип отчёта</CardTitle>
            <CardDescription>Выберите, что включить в отчёт</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {REPORT_TYPES.map((r) => (
                <button
                  key={r.type}
                  onClick={() => {
                    setType(r.type);
                    setGenerated(false);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                    type === r.type ? "border-brand bg-brand-50 ring-1 ring-brand/30" : "border-border hover:bg-canvas",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      type === r.type ? "bg-brand text-white" : "bg-canvas text-muted",
                    )}
                  >
                    <r.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.label}</p>
                    <p className="text-xs text-muted">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Config + actions */}
        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <CardTitle>Параметры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Период</label>
              <Select value={range.preset} onChange={(e) => setPreset(e.target.value as never)}>
                {PRESET_ORDER.map((p) => (
                  <option key={p} value={p}>{PRESET_LABELS[p]}</option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-muted">{range.label}</p>
            </div>

            <div className="rounded-xl bg-canvas p-3">
              <div className="flex items-center gap-2">
                <selectedMeta.icon className="size-4 text-brand" />
                <p className="text-sm font-medium text-ink">{selectedMeta.label}</p>
              </div>
              <p className="mt-1 text-xs text-muted">{selectedMeta.desc} · {range.label}</p>
            </div>

            <Button className="w-full" onClick={generate} disabled={generating}>
              {generating ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Формируем…
                </>
              ) : (
                <>
                  <Sparkles /> Сгенерировать отчёт
                </>
              )}
            </Button>

            {generated && (
              <div className="space-y-3 rounded-xl border border-brand/30 bg-brand-50/50 p-3 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
                  <CheckCircle2 className="size-4" /> Отчёт готов
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm"><FileText className="text-red-500" /> Скачать PDF</Button>
                  <Button variant="outline" size="sm"><FileSpreadsheet className="text-brand" /> Скачать Excel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {generated && (
        <Card className="animate-fade-in">
          <CardHeader className="flex-row items-center gap-2">
            <BarChart3 className="size-4.5 text-brand" />
            <CardTitle>{selectedMeta.label} · {range.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { l: "Строк данных", v: "1 248" },
                { l: "Период", v: range.label },
                { l: "Сформирован", v: "только что" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-canvas p-4">
                  <p className="text-sm text-muted">{s.l}</p>
                  <p className="mt-1 text-lg font-bold text-ink">{s.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Это демо-превью отчёта. В рабочей версии здесь будет полный документ с таблицами и графиками,
              готовый к выгрузке в PDF или Excel.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
