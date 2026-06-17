import { makeRng } from "./_shared";
import type { ChatBotFlow, ChatBotNode, ChatBotEdge, BotChannel, BotSimMessage, BotNodeType } from "../types";

const { int } = makeRng(330033);

export const NODE_META: Record<BotNodeType, { label: string; icon: string; color: string }> = {
  message: { label: "Сообщение", icon: "MessageSquare", color: "#16A34A" },
  question: { label: "Вопрос", icon: "HelpCircle", color: "#0EA5E9" },
  buttons: { label: "Кнопки", icon: "MousePointerClick", color: "#6366F1" },
  condition: { label: "Условие", icon: "GitBranch", color: "#FB923C" },
  collect_phone: { label: "Сбор телефона", icon: "Phone", color: "#14B8A6" },
  book_trial: { label: "Запись на пробный", icon: "CalendarPlus", color: "#FACC15" },
  handoff: { label: "Передача менеджеру", icon: "UserPlus", color: "#8B5CF6" },
  tag: { label: "Тег", icon: "Tag", color: "#EC4899" },
  delay: { label: "Задержка", icon: "Clock", color: "#9CA3AF" },
  webhook: { label: "Webhook", icon: "Webhook", color: "#EF4444" },
};

export const CHANNEL_LABEL: Record<BotChannel, string> = {
  instagram: "Instagram Direct",
  messenger: "Facebook Messenger",
  whatsapp: "WhatsApp",
};

function flow(
  id: string,
  name: string,
  channel: BotChannel,
  description: string,
  nodeDefs: [BotNodeType, string, string, string[]?][],
): ChatBotFlow {
  const nodes: ChatBotNode[] = nodeDefs.map((n, i) => ({
    id: `${id}-n${i + 1}`,
    type: n[0],
    title: n[1],
    text: n[2],
    options: n[3],
  }));
  const edges: ChatBotEdge[] = nodes.slice(0, -1).map((n, i) => ({
    id: `${id}-e${i + 1}`,
    from: n.id,
    to: nodes[i + 1].id,
  }));
  const runs = int(400, 4200);
  const phones = Math.round(runs * 0.22);
  const trials = Math.round(phones * 0.4);
  const handoffs = Math.round(runs * 0.08);
  return {
    id,
    name,
    channel,
    active: true,
    description,
    nodes,
    edges,
    stats: {
      runs,
      replies: Math.round(runs * 0.58),
      phones,
      trials,
      handoffs,
      conversion: +((trials / runs) * 100).toFixed(1),
    },
  };
}

export const BOT_FLOWS: ChatBotFlow[] = [
  flow("flow-ig-welcome", "Instagram welcome", "instagram", "Приветствие новых подписчиков и сбор контакта", [
    ["message", "Приветствие", "Привет! 👋 Это bilimdibol — школа английского. Помочь подобрать курс?"],
    ["buttons", "Выбор цели", "Что вам ближе?", ["Английский для работы", "IELTS", "Разговорный"]],
    ["question", "Уровень", "Какой у вас сейчас уровень английского?"],
    ["collect_phone", "Сбор телефона", "Оставьте номер — отправим программу и подарок 🎁"],
    ["book_trial", "Пробный урок", "Записать вас на бесплатный пробный урок?"],
    ["handoff", "Передача менеджеру", "Передаю вас менеджеру для подтверждения времени"],
  ]),
  flow("flow-comment-reply", "Ответ на комментарий", "instagram", "Автоответ на комментарии под рекламными постами", [
    ["condition", "Ключевое слово", "Если в комментарии есть «цена» / «курс» / «IELTS»"],
    ["message", "Ответ в директ", "Спасибо за интерес! Написали вам в Direct 💬"],
    ["question", "Уточнение", "Подскажите, для какой цели нужен английский?"],
    ["collect_phone", "Сбор телефона", "Оставьте номер, вышлем подробности"],
    ["tag", "Тег", "Пометить лид: из комментариев"],
  ]),
  flow("flow-wa-lead", "WhatsApp заявка", "whatsapp", "Обработка входящих заявок в WhatsApp", [
    ["message", "Приветствие", "Здравствуйте! Вы оставили заявку на курс английского bilimdibol."],
    ["question", "Цель", "Для чего планируете учить английский?"],
    ["buttons", "Формат", "Какой формат удобнее?", ["Индивидуально", "Группа", "Не знаю"]],
    ["book_trial", "Пробный урок", "Записать на бесплатный пробный урок?"],
    ["handoff", "Передача менеджеру", "Передаю менеджеру для подтверждения"],
  ]),
  flow("flow-trial-reminder", "Напоминание о пробном уроке", "whatsapp", "Снижение неявок на пробные уроки", [
    ["delay", "Задержка", "За 24 часа до урока"],
    ["message", "Напоминание", "Напоминаем: завтра в 18:00 ваш бесплатный пробный урок 🎓"],
    ["buttons", "Подтверждение", "Подтвердите участие", ["Буду", "Перенести", "Отменить"]],
    ["condition", "Если перенос", "Если выбрано «Перенести»"],
    ["handoff", "Передача менеджеру", "Менеджер подберёт новое время"],
  ]),
  flow("flow-reactivation", "Реактивация старых лидов", "instagram", "Возврат лидов, которые не дошли до оплаты", [
    ["message", "Оффер", "Вы интересовались английским 👀 Сейчас действует скидка на старт курса!"],
    ["buttons", "Интерес", "Актуально ещё?", ["Да, расскажите", "Не сейчас"]],
    ["condition", "Если да", "Если выбрано «Да, расскажите»"],
    ["collect_phone", "Сбор телефона", "Оставьте номер — менеджер вернётся с деталями"],
    ["tag", "Тег", "Пометить: реактивация"],
  ]),
];

/** Simulate a conversation from a flow object (works for mock and DB-loaded flows). */
export function simulateFlow(flow: ChatBotFlow, message: string): BotSimMessage[] {
  const out: BotSimMessage[] = [{ from: "user", text: message || "Здравствуйте" }];
  for (const node of flow.nodes) {
    switch (node.type) {
      case "message":
      case "question":
        out.push({ from: "bot", text: node.text });
        break;
      case "buttons":
        out.push({ from: "bot", text: node.text, options: node.options });
        break;
      case "collect_phone":
        out.push({ from: "bot", text: node.text });
        out.push({ from: "user", text: "+7 701 234 56 78" });
        break;
      case "book_trial":
        out.push({ from: "bot", text: node.text + " ✅ Записали на чт, 18:00." });
        break;
      case "handoff":
        out.push({ from: "bot", text: "🔁 " + node.text });
        break;
      case "condition":
      case "delay":
      case "tag":
      case "webhook":
        // internal nodes — not shown to the user
        break;
    }
  }
  return out;
}

/** Demo bot run simulator by flow id (used by the /api/bot/run route). */
export function simulateBotRun(flowId: string, message: string): BotSimMessage[] {
  const f = BOT_FLOWS.find((x) => x.id === flowId);
  if (!f) return [{ from: "bot", text: "Сценарий не найден" }];
  return simulateFlow(f, message);
}
