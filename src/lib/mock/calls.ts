import { HUNTERS, MANAGERS } from "../mock-data";
import { getRole } from "../roles";
import { makeRng, fullName, daysAgoISO } from "./_shared";
import type {
  CallRecord,
  CallLanguage,
  CallAnalysis,
  CallAnalysisChecklist,
  CallAnalysisStatus,
} from "../types";

const { rnd, pick, int } = makeRng(550022);

const LANGS: CallLanguage[] = ["ru", "kz", "mixed"];
export const LANG_LABEL: Record<CallLanguage, string> = {
  ru: "Русский",
  kz: "Казахский",
  mixed: "Смешанный",
};

const RESULTS = [
  "Назначен пробный урок",
  "Клиент думает",
  "Отказ — дорого",
  "Перезвонить позже",
  "Купил курс",
  "Не дозвонились",
];

const TRANSCRIPT_RU = [
  { speaker: "agent" as const, text: "Здравствуйте! Меня зовут Мадина, школа bilimdibol. Удобно говорить?" },
  { speaker: "client" as const, text: "Да, здравствуйте. Я оставляла заявку на английский." },
  { speaker: "agent" as const, text: "Отлично! Подскажите, для каких целей хотите изучать английский?" },
  { speaker: "client" as const, text: "Для работы, нужно общаться с иностранными партнёрами." },
  { speaker: "agent" as const, text: "Понял вас. У нас есть курс English for Work. Давайте запишу вас на бесплатный пробный урок?" },
  { speaker: "client" as const, text: "Хорошо, давайте попробуем." },
  { speaker: "agent" as const, text: "Записал на четверг в 18:00. Я пришлю напоминание в WhatsApp. Хорошего дня!" },
];

const TRANSCRIPT_KZ = [
  { speaker: "agent" as const, text: "Сәлеметсіз бе! Bilimdibol мектебінен Аружан. Сөйлесуге ыңғайлы ма?" },
  { speaker: "client" as const, text: "Иә, сәлеметсіз бе. Ағылшын тілі курсына өтінім қалдырғанмын." },
  { speaker: "agent" as const, text: "Жақсы! Ағылшын тілін қандай мақсатпен үйренгіңіз келеді?" },
  { speaker: "client" as const, text: "IELTS тапсыру керек, шетелге оқуға барамын." },
  { speaker: "agent" as const, text: "Түсіндім. Бізде IELTS Pro курсы бар. Тегін сынақ сабаққа жазайын ба?" },
  { speaker: "client" as const, text: "Иә, болады." },
];

function buildAnalysis(score: number, lang: CallLanguage): CallAnalysis {
  // Higher score → more checklist items pass
  const pass = (threshold: number) => score >= threshold || (score >= threshold - 12 && rnd() > 0.5);
  const checklist: CallAnalysisChecklist = {
    greeting: pass(40),
    politeTone: pass(45),
    needsDiscovered: pass(55),
    coursePresented: pass(60),
    objectionsHandled: pass(70),
    trialOffered: pass(58),
    nextStepFixed: pass(65),
    properClosing: pass(50),
    scriptFollowed: pass(62),
  };
  const recs: string[] = [];
  if (!checklist.needsDiscovered) recs.push("Глубже выявлять потребность клиента в начале разговора");
  if (!checklist.objectionsHandled) recs.push("Отработать возражение «дорого» через ценность и рассрочку");
  if (!checklist.trialOffered) recs.push("Всегда предлагать бесплатный пробный урок");
  if (!checklist.nextStepFixed) recs.push("Чётко фиксировать следующий шаг и дату касания");
  if (recs.length === 0) recs.push("Разговор близок к эталону — поддерживать темп и тон");

  return {
    summary:
      lang === "kz"
        ? "Менеджер сәлемдесіп, қажеттілікті анықтап, IELTS курсын ұсынды. Сынақ сабаққа жазылды."
        : "Менеджер поздоровался, выявил цель (английский для работы), презентовал курс и записал клиента на пробный урок.",
    checklist,
    score,
    recommendations: recs,
    detectedLanguage: lang,
    good:
      score >= 70
        ? "Вежливый тон, выявлена потребность, предложен пробный урок."
        : "Хорошее приветствие и контакт с клиентом.",
    improve:
      score >= 70
        ? "Чуть увереннее работать с ценой."
        : "Не хватило работы с возражениями и фиксации следующего шага.",
  };
}

const AGENTS = [...HUNTERS, ...MANAGERS];

export const CALLS: CallRecord[] = Array.from({ length: 18 }).map((_, i) => {
  const agent = pick(AGENTS);
  const lang = LANGS[i % LANGS.length];
  const status: CallAnalysisStatus = i % 6 === 0 ? "pending" : i % 9 === 0 ? "analyzing" : "done";
  const score = status === "done" ? int(48, 96) : 0;
  const transcript = lang === "kz" ? TRANSCRIPT_KZ : TRANSCRIPT_RU;
  return {
    id: `call-${i + 1}`,
    date: daysAgoISO(int(0, 20), int(9, 19), int(0, 59)),
    employeeId: agent.id,
    employeeName: agent.name,
    role: agent.role,
    clientName: fullName(i + 4),
    durationSec: int(95, 760),
    language: lang,
    status,
    score: status === "done" ? score : null,
    result: pick(RESULTS),
    dealId: rnd() > 0.4 ? `deal-${int(1, 22)}` : undefined,
    transcript,
    analysis: status === "done" ? buildAnalysis(score, lang) : null,
  };
});

export { buildAnalysis, getRole };
