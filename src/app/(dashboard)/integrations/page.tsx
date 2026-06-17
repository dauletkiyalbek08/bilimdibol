"use client";

import * as React from "react";
import {
  Instagram,
  MessageCircle,
  MessageSquare,
  Webhook,
  Sparkles,
  Database,
  Cloud,
  Plug,
  Copy,
  Check,
  Loader2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { INTEGRATIONS } from "@/lib/mock/integrations";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime, cn } from "@/lib/utils";
import type { IntegrationChannel, IntegrationStatus } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Instagram,
  MessageCircle,
  MessageSquare,
  Webhook,
  Sparkles,
  Database,
  Cloud,
};

const STATUS_META: Record<IntegrationStatus, { label: string; variant: "green" | "yellow" | "red" }> = {
  connected: { label: "Подключено", variant: "green" },
  mock: { label: "Demo / Mock mode", variant: "yellow" },
  error: { label: "Ошибка", variant: "red" },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bilimdibol.vercel.app";

export default function IntegrationsPage() {
  return (
    <RoleBasedGuard page="integrations">
      <IntegrationsInner />
    </RoleBasedGuard>
  );
}

function IntegrationsInner() {
  const { range } = useApp();
  const [results, setResults] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  async function checkConnection(ch: IntegrationChannel) {
    setLoading(`${ch.id}:check`);
    try {
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      const found = data.integrations.find((i: { id: string; connected: boolean }) => i.id === ch.id);
      setResults((p) => ({ ...p, [ch.id]: found?.connected ? "✓ Подключение активно" : "Demo mode — токены не заданы" }));
    } catch {
      setResults((p) => ({ ...p, [ch.id]: "Ошибка проверки" }));
    }
    setLoading(null);
  }

  async function testWebhook(ch: IntegrationChannel) {
    if (!ch.webhookUrl) return;
    setLoading(`${ch.id}:webhook`);
    try {
      let res: Response;
      if (ch.webhookUrl.includes("/webhooks/")) {
        // Meta-style verification handshake
        const url = `${ch.webhookUrl}?hub.mode=subscribe&hub.verify_token=bilimdibol-demo-verify-token&hub.challenge=ok`;
        res = await fetch(url);
        const text = await res.text();
        setResults((p) => ({ ...p, [ch.id]: res.ok ? `✓ Webhook отвечает (${text})` : `Код ${res.status}` }));
      } else {
        res = await fetch(ch.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true }),
        });
        const data = await res.json();
        setResults((p) => ({ ...p, [ch.id]: `✓ Ответ: ${data.mode ?? res.status}` }));
      }
    } catch {
      setResults((p) => ({ ...p, [ch.id]: "Ошибка webhook" }));
    }
    setLoading(null);
  }

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Интеграции" description={`Подключение каналов и сервисов · ${range.label}`} />

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Plug className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-ink">Demo mode</p>
              <p className="text-sm text-muted">Реальные токены не заданы — сообщения не отправляются. Verify token: <code className="rounded bg-canvas px-1.5 py-0.5 text-xs">bilimdibol-demo-verify-token</code></p>
            </div>
          </div>
          <Badge variant="yellow">Mock</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {INTEGRATIONS.map((ch) => {
          const Icon = ICONS[ch.icon] ?? Plug;
          const sm = STATUS_META[ch.status];
          const fullWebhook = ch.webhookUrl ? `${APP_URL}${ch.webhookUrl}` : null;
          return (
            <Card key={ch.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-canvas text-ink">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <CardTitle>{ch.name}</CardTitle>
                    <p className="text-sm text-muted">{ch.description}</p>
                  </div>
                </div>
                <Badge variant={sm.variant}>{sm.label}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Env vars */}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Переменные окружения</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.envVars.map((v) => (
                      <code key={v} className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] text-ink">{v}</code>
                    ))}
                  </div>
                </div>

                {/* Webhook */}
                {fullWebhook && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Webhook URL</p>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas/50 px-2.5 py-1.5">
                      <code className="flex-1 truncate text-xs text-ink">{fullWebhook}</code>
                      <button onClick={() => copy(fullWebhook, ch.id)} className="text-muted hover:text-ink">
                        {copied === ch.id ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Last events */}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Последние события</p>
                  <div className="space-y-1">
                    {ch.events.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between rounded-lg bg-canvas/60 px-2.5 py-1.5 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className={cn("size-1.5 rounded-full", ev.status === "ok" ? "bg-brand" : ev.status === "pending" ? "bg-amber-400" : "bg-red-400")} />
                          <span className="font-medium text-ink">{ev.type}</span>
                        </span>
                        <span className="text-muted">{fmtDateTime(ev.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {results[ch.id] && (
                  <p className="rounded-lg bg-brand-50/60 px-2.5 py-1.5 text-xs text-brand-700">{results[ch.id]}</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => checkConnection(ch)} disabled={loading === `${ch.id}:check`}>
                    {loading === `${ch.id}:check` ? <Loader2 className="animate-spin" /> : <Zap />} Проверить подключение
                  </Button>
                  {ch.webhookUrl && (
                    <Button variant="ghost" size="sm" onClick={() => testWebhook(ch)} disabled={loading === `${ch.id}:webhook`}>
                      {loading === `${ch.id}:webhook` ? <Loader2 className="animate-spin" /> : <Webhook />} Тест webhook
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
