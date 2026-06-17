import { makeRng, daysAgoISO } from "./_shared";
import type { IntegrationChannel, IntegrationEvent } from "../types";

const { pick, int } = makeRng(990044);

function events(channel: string, samples: string[]): IntegrationEvent[] {
  return Array.from({ length: 4 }).map((_, i) => ({
    id: `${channel}-ev-${i + 1}`,
    channel,
    type: pick(samples),
    payload: pick([
      '{ "from": "+7701…", "text": "Здравствуйте" }',
      '{ "comment_id": "178…", "text": "Цена?" }',
      '{ "message": "Хочу пробный урок" }',
      '{ "event": "Lead", "value": 0 }',
    ]),
    time: daysAgoISO(0, int(8, 20), int(0, 59)),
    status: pick(["ok", "ok", "pending", "failed"] as const),
  }));
}

export const INTEGRATIONS: IntegrationChannel[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: "Instagram",
    status: "mock",
    description: "Direct-сообщения, комментарии и упоминания bio link",
    envVars: ["IG_BUSINESS_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN"],
    webhookUrl: "/api/webhooks/meta",
    events: events("instagram", ["message", "comment", "mention"]),
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    icon: "MessageCircle",
    status: "mock",
    description: "Входящие сообщения со страницы Facebook",
    envVars: ["FACEBOOK_PAGE_ID", "META_PAGE_ACCESS_TOKEN"],
    webhookUrl: "/api/webhooks/meta",
    events: events("messenger", ["message", "postback"]),
  },
  {
    id: "whatsapp",
    name: "WhatsApp Cloud API",
    icon: "MessageSquare",
    status: "mock",
    description: "Заявки и переписка через WhatsApp Cloud API",
    envVars: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_BUSINESS_ACCOUNT_ID"],
    webhookUrl: "/api/webhooks/whatsapp",
    events: events("whatsapp", ["message", "status", "template"]),
  },
  {
    id: "meta-capi",
    name: "Meta CAPI",
    icon: "Webhook",
    status: "mock",
    description: "Server-side конверсии (Lead, Purchase) в Meta",
    envVars: ["META_APP_ID", "META_APP_SECRET", "META_VERIFY_TOKEN"],
    webhookUrl: "/api/webhooks/meta",
    events: events("meta-capi", ["Lead", "Purchase", "Schedule"]),
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "Sparkles",
    status: "mock",
    description: "AI-анализ звонков, в т.ч. на казахском языке",
    envVars: ["DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL"],
    webhookUrl: "/api/ai/deepseek",
    events: events("deepseek", ["analyze_call", "summary"]),
  },
  {
    id: "supabase",
    name: "Supabase",
    icon: "Database",
    status: "mock",
    description: "База данных и аутентификация (черновик схемы готов)",
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    events: events("supabase", ["insert", "update"]),
  },
  {
    id: "vercel",
    name: "Vercel",
    icon: "Cloud",
    status: "mock",
    description: "Хостинг и деплой платформы",
    envVars: ["NEXT_PUBLIC_APP_URL"],
    events: events("vercel", ["deployment", "build"]),
  },
];
