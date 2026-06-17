// =============================================================
// DeepSeek integration (prepared, not live).
// If DEEPSEEK_API_KEY is set, a real request is attempted;
// otherwise a deterministic mock analysis is returned.
// Used primarily for call analysis, incl. Kazakh language.
// =============================================================
import type { CallAnalysis, CallAnalysisChecklist, CallLanguage } from "../types";

export interface TranscriptLine {
  speaker: "agent" | "client";
  text: string;
}

export type CallTranscript = string | TranscriptLine[];

function toText(t: CallTranscript): string {
  if (typeof t === "string") return t;
  return t.map((l) => `${l.speaker === "agent" ? "Менеджер" : "Клиент"}: ${l.text}`).join("\n");
}

function detectLanguage(text: string): CallLanguage {
  const kz = /[әғқңөұүһі]/i.test(text);
  const ru = /[а-яё]/i.test(text);
  if (kz && ru) return "mixed";
  if (kz) return "kz";
  return "ru";
}

/** Deterministic mock analysis derived from transcript content. */
export function mockAnalyzeCall(transcript: CallTranscript): CallAnalysis {
  const text = toText(transcript).toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  const checklist: CallAnalysisChecklist = {
    greeting: has("здравств", "сәлем", "привет", "добрый"),
    politeTone: !has("грубо") && text.length > 0,
    needsDiscovered: has("цел", "для чего", "мақсат", "зачем", "нужно"),
    coursePresented: has("курс", "ielts", "speaking", "english", "программа"),
    objectionsHandled: has("дорого", "подума", "рассроч", "скидк", "қымбат"),
    trialOffered: has("пробн", "сынақ", "trial", "бесплатн"),
    nextStepFixed: has("запис", "жазып", "четверг", "время", "напомн", "перезвон"),
    properClosing: has("хорошего дня", "до связи", "сау бол", "спасибо"),
    scriptFollowed: text.length > 120,
  };

  const passed = Object.values(checklist).filter(Boolean).length;
  const score = Math.round((passed / 9) * 100);

  const recommendations: string[] = [];
  if (!checklist.needsDiscovered) recommendations.push("Глубже выявлять потребность клиента");
  if (!checklist.objectionsHandled) recommendations.push("Отрабатывать возражение «дорого» через ценность и рассрочку");
  if (!checklist.trialOffered) recommendations.push("Всегда предлагать бесплатный пробный урок");
  if (!checklist.nextStepFixed) recommendations.push("Фиксировать следующий шаг и дату касания");
  if (recommendations.length === 0) recommendations.push("Разговор близок к эталону — держать темп");

  const lang = detectLanguage(toText(transcript));

  return {
    summary:
      "Менеджер провёл разговор с клиентом по поводу курса английского. " +
      `Выполнено ${passed} из 9 пунктов чек-листа качества.`,
    checklist,
    score,
    recommendations,
    detectedLanguage: lang,
    good: passed >= 6 ? "Хорошее приветствие, выявлена потребность, предложен пробный." : "Установлен контакт с клиентом.",
    improve: passed >= 6 ? "Усилить работу с ценой." : "Не хватило работы с возражениями и фиксации следующего шага.",
  };
}

/**
 * Analyze a call transcript. Falls back to a mock when no API key is set.
 * The real request structure for DeepSeek is prepared below.
 */
export async function analyzeCallWithDeepSeek(transcript: CallTranscript): Promise<CallAnalysis> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

  if (!apiKey) {
    // Demo mode — no secret configured.
    return mockAnalyzeCall(transcript);
  }

  // --- Prepared real request (executed only when a key is present) ---
  const systemPrompt =
    "Ты — ассистент контроля качества звонков школы английского bilimdibol. " +
    "Проанализируй разговор (русский или казахский) и верни JSON с полями: " +
    "summary, checklist (9 булевых пунктов), score (0-100), recommendations[], detectedLanguage, good, improve.";

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: toText(transcript) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) return JSON.parse(content) as CallAnalysis;
    return mockAnalyzeCall(transcript);
  } catch {
    // Network/parse failure → safe fallback for the demo.
    return mockAnalyzeCall(transcript);
  }
}
