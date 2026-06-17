"use client";

import * as React from "react";
import { Copy, Check, ExternalLink, ListChecks, LayoutTemplate } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUNNEL_OFFERS } from "@/lib/funnels-config";

interface FunnelLink {
  title: string;
  path: string;
  type: "Квиз" | "Лендинг";
  desc: string;
}

export default function FunnelsCatalog() {
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => setOrigin(window.location.origin), []);

  const funnels: FunnelLink[] = [
    { title: "Квиз «Подбор программы»", path: "/quiz", type: "Квиз", desc: "Пошаговый опрос → заявка" },
    { title: "Лендинг (общий)", path: "/lp", type: "Лендинг", desc: "Универсальная форма" },
    ...FUNNEL_OFFERS.map((o) => ({
      title: o.title,
      path: `/f/${o.slug}`,
      type: "Лендинг" as const,
      desc: o.subtitle,
    })),
  ];

  function copy(path: string) {
    const url = `${origin}${path}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(path);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo size={32} />
          <span className="text-sm text-muted">Воронки и ссылки</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-bold text-ink">Лендинги и воронки</h1>
        <p className="mt-1 text-sm text-muted">
          Готовые ссылки для рекламы. Любая заявка автоматически попадает в CRM и назначается на hunter-а.
          Добавляйте UTM-метки: <code className="rounded bg-white px-1.5 py-0.5 text-xs">?utm_source=Instagram&amp;utm_campaign=…&amp;utm_content=…</code>
        </p>

        <div className="mt-6 space-y-3">
          {funnels.map((f) => (
            <div key={f.path} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  {f.type === "Квиз" ? <ListChecks className="size-5" /> : <LayoutTemplate className="size-5" />}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{f.title}</p>
                    <Badge variant={f.type === "Квиз" ? "purple" : "blue"}>{f.type}</Badge>
                  </div>
                  <p className="truncate text-sm text-muted">{f.desc}</p>
                  <code className="mt-1 block truncate text-xs text-brand-700">{origin}{f.path}</code>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(f.path)}>
                  {copied === f.path ? <><Check className="text-brand" /> Скопировано</> : <><Copy /> Копировать</>}
                </Button>
                <a href={f.path} target="_blank" rel="noopener noreferrer">
                  <Button size="sm"><ExternalLink /> Открыть</Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
