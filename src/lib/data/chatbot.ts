// ChatBot flows data access — Supabase when configured, else mock.
import { getSupabase } from "../supabase/client";
import { BOT_FLOWS } from "../mock/chatbot";
import type { ChatBotFlow, ChatBotNode, BotChannel, BotNodeType } from "../types";

interface NodeRow {
  id: string;
  type: string;
  title: string | null;
  text: string | null;
  options: string[] | null;
  position: number | null;
}

interface FlowRow {
  id: string;
  name: string;
  channel: string;
  active: boolean | null;
  description: string | null;
  runs: number | null;
  replies: number | null;
  phones: number | null;
  trials: number | null;
  handoffs: number | null;
  conversion: number | null;
  bot_nodes?: NodeRow[] | null;
}

function mapNode(n: NodeRow): ChatBotNode {
  return {
    id: n.id,
    type: n.type as BotNodeType,
    title: n.title ?? "",
    text: n.text ?? "",
    options: n.options ?? undefined,
  };
}

function mapFlow(r: FlowRow): ChatBotFlow {
  const nodes = (r.bot_nodes ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(mapNode);
  return {
    id: r.id,
    name: r.name,
    channel: r.channel as BotChannel,
    active: r.active ?? true,
    description: r.description ?? "",
    nodes,
    edges: [],
    stats: {
      runs: r.runs ?? 0,
      replies: r.replies ?? 0,
      phones: r.phones ?? 0,
      trials: r.trials ?? 0,
      handoffs: r.handoffs ?? 0,
      conversion: r.conversion ?? 0,
    },
  };
}

export async function fetchFlows(): Promise<ChatBotFlow[]> {
  const sb = getSupabase();
  if (!sb) return BOT_FLOWS;
  try {
    const { data, error } = await sb.from("bot_flows").select("*, bot_nodes(*)");
    if (error || !data || data.length === 0) return BOT_FLOWS;
    return (data as FlowRow[]).map(mapFlow);
  } catch {
    return BOT_FLOWS;
  }
}
