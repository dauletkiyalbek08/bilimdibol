"use client";

import * as React from "react";
import {
  Bot,
  Plus,
  Play,
  Send,
  Instagram,
  MessageCircle,
  MessageSquare,
  HelpCircle,
  MousePointerClick,
  GitBranch,
  Phone,
  CalendarPlus,
  UserPlus,
  Tag,
  Clock,
  Webhook,
  ArrowDown,
  Users,
  PhoneCall,
  GraduationCap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { NODE_META, CHANNEL_LABEL, simulateFlow } from "@/lib/mock/chatbot";
import { fetchFlows } from "@/lib/data/chatbot";
import { PageHeader } from "@/components/page-header";
import { RoleBasedGuard } from "@/components/role-based-guard";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatNumber, cn } from "@/lib/utils";
import type { ChatBotFlow, ChatBotNode, BotChannel, BotSimMessage, BotNodeType } from "@/lib/types";

const NODE_ICONS: Record<string, LucideIcon> = {
  MessageSquare,
  HelpCircle,
  MousePointerClick,
  GitBranch,
  Phone,
  CalendarPlus,
  UserPlus,
  Tag,
  Clock,
  Webhook,
};
const CHANNEL_ICONS: Record<BotChannel, LucideIcon> = {
  instagram: Instagram,
  messenger: MessageCircle,
  whatsapp: MessageSquare,
};

export default function ChatbotPage() {
  return (
    <RoleBasedGuard page="chatbot">
      <ChatbotInner />
    </RoleBasedGuard>
  );
}

function ChatbotInner() {
  const { range } = useApp();
  const [flows, setFlows] = React.useState<ChatBotFlow[]>([]);
  const [flowId, setFlowId] = React.useState<string | null>(null);
  const [nodeId, setNodeId] = React.useState<string | null>(null);
  const [sim, setSim] = React.useState<BotSimMessage[]>([]);
  const [simInput, setSimInput] = React.useState("Здравствуйте");

  React.useEffect(() => {
    let active = true;
    fetchFlows().then((rows) => {
      if (active) {
        setFlows(rows);
        setFlowId(rows[0]?.id ?? null);
        setNodeId(rows[0]?.nodes[0]?.id ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const flow = flows.find((f) => f.id === flowId) ?? null;
  const node = flow?.nodes.find((n) => n.id === nodeId) ?? null;

  function runSim() {
    if (flow) setSim(simulateFlow(flow, simInput));
  }

  function toggleActive() {
    setFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, active: !f.active } : f)));
  }

  if (!flow) {
    return (
      <div className="space-y-6">
        <PageHeader title="ChatBot Builder" description={`Собственный чат-бот вместо ChatPlace · ${range.label}`} />
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          Загрузка сценариев…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="ChatBot Builder" description={`Собственный чат-бот вместо ChatPlace · ${range.label}`}>
        <Button><Plus /> Новый сценарий</Button>
      </PageHeader>

      {/* Flow selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {flows.map((f) => {
          const Icon = CHANNEL_ICONS[f.channel];
          return (
            <button
              key={f.id}
              onClick={() => {
                setFlowId(f.id);
                setNodeId(f.nodes[0]?.id ?? null);
                setSim([]);
              }}
              className={cn(
                "flex w-60 shrink-0 items-start gap-2.5 rounded-xl border bg-white p-3 text-left transition-all",
                f.id === flowId ? "border-brand ring-1 ring-brand/30" : "border-border hover:bg-canvas",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
                <p className="truncate text-xs text-muted">{CHANNEL_LABEL[f.channel]}</p>
                <Badge variant={f.active ? "green" : "gray"} className="mt-1">{f.active ? "Активен" : "Выключен"}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <MetricCard title="Запуски" value={formatNumber(flow.stats.runs)} icon={Play} accent="blue" />
        <MetricCard title="Ответы" value={formatNumber(flow.stats.replies)} icon={MessageSquare} accent="green" />
        <MetricCard title="Телефоны" value={formatNumber(flow.stats.phones)} icon={PhoneCall} accent="yellow" />
        <MetricCard title="Пробные" value={formatNumber(flow.stats.trials)} icon={GraduationCap} accent="orange" />
        <MetricCard title="Менеджеру" value={formatNumber(flow.stats.handoffs)} icon={Users} accent="purple" />
        <MetricCard title="Конверсия" value={`${flow.stats.conversion}%`} icon={TrendingUp} accent="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Block palette */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Типы блоков</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted">
                Сценарий активен
                <Switch checked={flow.active} onCheckedChange={toggleActive} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NODE_META) as BotNodeType[]).map((t) => {
                  const meta = NODE_META[t];
                  const Icon = NODE_ICONS[meta.icon];
                  return (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink">
                      <Icon className="size-3.5" style={{ color: meta.color }} /> {meta.label}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="size-4.5 text-brand" /> Сценарий «{flow.name}»</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-1">
                {flow.nodes.map((n, i) => {
                  const meta = NODE_META[n.type];
                  const Icon = NODE_ICONS[meta.icon];
                  return (
                    <React.Fragment key={n.id}>
                      <button
                        onClick={() => setNodeId(n.id)}
                        className={cn(
                          "w-full max-w-md rounded-xl border bg-white p-3 text-left transition-all",
                          nodeId === n.id ? "border-brand ring-1 ring-brand/30" : "border-border hover:bg-canvas",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
                            <Icon className="size-4" />
                          </span>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted">{meta.label}</span>
                          <span className="ml-auto text-xs text-muted">#{i + 1}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-ink">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.text}</p>
                        {n.options && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {n.options.map((o) => (
                              <span key={o} className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] text-ink">{o}</span>
                            ))}
                          </div>
                        )}
                      </button>
                      {i < flow.nodes.length - 1 && <ArrowDown className="size-4 text-border" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected node settings */}
          {node && (
            <Card>
              <CardHeader>
                <CardTitle>Настройки блока</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Тип блока</label>
                  <Input value={NODE_META[node.type].label} disabled />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Заголовок</label>
                  <Input
                    value={node.title}
                    onChange={(e) =>
                      setFlows((prev) =>
                        prev.map((f) =>
                          f.id === flowId
                            ? { ...f, nodes: f.nodes.map((x) => (x.id === node.id ? { ...x, title: e.target.value } : x)) }
                            : f,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Текст сообщения</label>
                  <textarea
                    value={node.text}
                    onChange={(e) =>
                      setFlows((prev) =>
                        prev.map((f) =>
                          f.id === flowId
                            ? { ...f, nodes: f.nodes.map((x) => (x.id === node.id ? { ...x, text: e.target.value } : x)) }
                            : f,
                        ),
                      )
                    }
                    rows={3}
                    className="w-full rounded-lg border border-border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  />
                </div>
                {node.options && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Кнопки / варианты</label>
                    <div className="flex flex-wrap gap-1.5">
                      {node.options.map((o) => (
                        <span key={o} className="rounded-md bg-canvas px-2 py-1 text-xs text-ink">{o}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Simulator */}
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Play className="size-4.5 text-brand" /> Симулятор диалога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-80 space-y-2 overflow-y-auto rounded-xl bg-canvas p-3">
              {sim.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Запустите сценарий, чтобы увидеть диалог</p>
              ) : (
                sim.map((m, i) => (
                  <div key={i} className={cn("flex", m.from === "bot" ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.from === "bot" ? "bg-white text-ink shadow-soft" : "bg-brand text-white")}>
                      {m.text}
                      {m.options && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.options.map((o) => (
                            <span key={o} className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] text-ink">{o}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input value={simInput} onChange={(e) => setSimInput(e.target.value)} placeholder="Сообщение клиента…" />
              <Button onClick={runSim}><Send /></Button>
            </div>
            <Button variant="outline" className="w-full" onClick={runSim}>
              <Play /> Запустить сценарий
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
