import { PROJECT } from "../roles";
import { HUNTERS, MANAGERS, SOURCES, PRICES, employeeName } from "../mock-data";
import { makeRng, fullName, phoneFor, daysAgoISO, daysFromNowISO } from "./_shared";
import type { Deal, DealStage, LeadQuality } from "../types";

const PID = PROJECT.id;
const { rnd, pick, int } = makeRng(770011);

export const DEAL_STAGES: { id: DealStage; label: string; accent: string }[] = [
  { id: "new", label: "Новый лид", accent: "#0EA5E9" },
  { id: "contacted", label: "Контакт установлен", accent: "#6366F1" },
  { id: "trial_scheduled", label: "Пробный назначен", accent: "#FACC15" },
  { id: "trial_done", label: "Пробный проведён", accent: "#FB923C" },
  { id: "contract", label: "Договор", accent: "#8B5CF6" },
  { id: "payment", label: "Оплата", accent: "#14B8A6" },
  { id: "won", label: "Успешно", accent: "#16A34A" },
  { id: "lost", label: "Потерян", accent: "#EF4444" },
];

const STAGE_PROB: Record<DealStage, number> = {
  new: 10,
  contacted: 25,
  trial_scheduled: 45,
  trial_done: 60,
  contract: 75,
  payment: 90,
  won: 100,
  lost: 0,
};

const QUALITIES: LeadQuality[] = ["hot", "warm", "cold"];
const NEXT_STEPS = [
  "Позвонить и квалифицировать",
  "Отправить программу курса",
  "Назначить пробный урок",
  "Напомнить о пробном",
  "Выставить договор",
  "Проконтролировать оплату",
  "Запросить отзыв",
  "Вернуть в работу через месяц",
];
const COMMENTS = [
  "Интересует IELTS до конца года",
  "Просит рассрочку на 3 месяца",
  "Сравнивает с другой школой",
  "Готов начать со следующей недели",
  "Нужен английский для работы",
  "Сомневается в расписании",
  "Хочет групповой формат",
  "Оставил заявку через bio link",
];
const UTM = ["ielts_cold", "speaking_retarget", "a1a2_lookalike", "tiktok_trends", "search_almaty", "bio_link_promo"];

function stageForIndex(i: number): DealStage {
  // Distribute deals across the pipeline, weighted toward the middle
  const order: DealStage[] = [
    "new", "new", "contacted", "contacted", "trial_scheduled", "trial_scheduled",
    "trial_done", "trial_done", "contract", "payment", "won", "won", "lost",
  ];
  return order[i % order.length];
}

export const DEALS: Deal[] = Array.from({ length: 22 }).map((_, i) => {
  const stage = stageForIndex(i);
  const hunter = pick(HUNTERS);
  const manager = pick(MANAGERS);
  const created = daysAgoISO(int(1, 40));
  const advanced = stage === "won" || stage === "payment" || stage === "contract";
  const history = [
    { date: created, author: hunter.name, text: "Сделка создана из заявки" },
    ...(rnd() > 0.4
      ? [{ date: daysAgoISO(int(1, 15)), author: hunter.name, text: pick(["Первый контакт, отправил оффер", "Назначен пробный урок", "Провели пробный, клиент думает", "Согласовали договор"]) }]
      : []),
  ];
  return {
    id: `deal-${i + 1}`,
    projectId: PID,
    clientName: fullName(i + 2),
    phone: phoneFor(i + 2),
    source: pick(SOURCES),
    amount: pick(PRICES),
    hunterId: hunter.id,
    managerId: manager.id,
    stage,
    nextStep: stage === "won" ? "Сделка закрыта" : stage === "lost" ? "В архиве" : pick(NEXT_STEPS),
    nextTouch: stage === "won" || stage === "lost" ? undefined : daysFromNowISO(int(0, 6)),
    quality: pick(QUALITIES),
    probability: STAGE_PROB[stage],
    comment: pick(COMMENTS),
    utmCampaign: pick(UTM),
    creativeId: `cr-${int(1, 10)}`,
    contractStatus: advanced ? pick(["Отправлен", "Подписан"] as const) : pick(["Нет", "Черновик"] as const),
    receiptStatus: stage === "won" || stage === "payment" ? pick(["На проверке", "Подтверждён"] as const) : "Нет",
    createdAt: created,
    history,
    tasks: [
      { id: `t-${i}-1`, title: pick(NEXT_STEPS), due: daysFromNowISO(int(0, 4)), done: false },
      ...(rnd() > 0.5 ? [{ id: `t-${i}-2`, title: "Перезвонить клиенту", due: daysAgoISO(int(1, 3)), done: true }] : []),
    ],
  };
});

export { employeeName };
