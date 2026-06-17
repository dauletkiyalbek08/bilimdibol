"use client";

import * as React from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, Gift } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  question: string;
  subtitle?: string;
  options: string[];
}

const STEPS: Step[] = [
  {
    key: "Цель",
    question: "Зачем вам английский?",
    subtitle: "Подберём программу под вашу цель",
    options: ["Для работы / карьеры", "Сдать IELTS", "Путешествия", "Для себя", "Для ребёнка"],
  },
  {
    key: "Уровень",
    question: "Какой у вас сейчас уровень?",
    options: ["С нуля", "Базовый (A1–A2)", "Средний (B1–B2)", "Продвинутый", "Не знаю — нужен тест"],
  },
  {
    key: "Формат",
    question: "Как удобнее заниматься?",
    options: ["Индивидуально", "В мини-группе", "Пока не определился"],
  },
  {
    key: "Старт",
    question: "Когда хотите начать?",
    options: ["Прямо сейчас", "В этом месяце", "Просто интересуюсь"],
  },
];

export default function QuizPage() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [contact, setContact] = React.useState({ name: "", phone: "" });
  const [status, setStatus] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [utm, setUtm] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtm({
      utm_source: p.get("utm_source") || "",
      utm_campaign: p.get("utm_campaign") || "",
      utm_content: p.get("utm_content") || "",
    });
  }, []);

  const totalSteps = STEPS.length + 1; // questions + contact step
  const progress = Math.round(((step + (status === "done" ? 1 : 0)) / totalSteps) * 100);
  const isContactStep = step === STEPS.length;

  function choose(stepKey: string, value: string) {
    setAnswers((a) => ({ ...a, [stepKey]: value }));
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.name.trim() || !contact.phone.trim()) return;
    setStatus("sending");
    const summary = STEPS.map((s) => `${s.key}: ${answers[s.key] ?? "—"}`).join(" · ");
    try {
      const res = await fetch("/api/leads/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
          comment: `Квиз → ${summary}`,
          source: utm.utm_source || "Quiz",
          utm_campaign: utm.utm_campaign,
          creative_id: utm.utm_content,
        }),
      });
      const data = await res.json();
      setStatus(data.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Top bar with progress */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <Logo size={30} />
          <span className="text-sm text-muted">Шаг {Math.min(step + 1, totalSteps)} из {totalSteps}</span>
        </div>
        <div className="h-1 w-full bg-canvas">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8">
        {status === "done" ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-card">
            <CheckCircle2 className="size-16 text-brand" />
            <h1 className="mt-4 text-2xl font-bold text-ink">Спасибо! Заявка принята 🎉</h1>
            <p className="mt-2 max-w-md text-muted">
              Мы подобрали для вас программу и свяжемся в ближайшее время, чтобы записать на
              бесплатный пробный урок.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700">
              <Gift className="size-4" /> Бонус: подарок на первом занятии
            </div>
          </div>
        ) : isContactStep ? (
          <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-bold text-ink">Последний шаг 🎯</h1>
            <p className="mt-1 text-muted">Куда отправить программу и записать на бесплатный пробный урок?</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Имя</label>
                <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Как вас зовут?" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Телефон / WhatsApp</label>
                <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+7 ___ ___ __ __" required />
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full" disabled={status === "sending"}>
              {status === "sending" ? "Отправляем…" : <>Получить программу <ArrowRight /></>}
            </Button>
            {status === "error" && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Не удалось отправить. Попробуйте ещё раз.
              </p>
            )}
            <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-4 flex items-center gap-1 text-sm text-muted hover:text-ink">
              <ArrowLeft className="size-4" /> Назад
            </button>
          </form>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{STEPS[step].question}</h1>
            {STEPS[step].subtitle && <p className="mt-2 text-muted">{STEPS[step].subtitle}</p>}
            <div className="mt-6 space-y-3">
              {STEPS[step].options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => choose(STEPS[step].key, opt)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border bg-white px-5 py-4 text-left text-base font-medium shadow-soft transition-all hover:border-brand hover:bg-brand-50",
                    answers[STEPS[step].key] === opt ? "border-brand ring-1 ring-brand/30" : "border-border",
                  )}
                >
                  {opt}
                  <ArrowRight className="size-4 text-muted" />
                </button>
              ))}
            </div>
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="mt-6 flex items-center gap-1 text-sm text-muted hover:text-ink">
                <ArrowLeft className="size-4" /> Назад
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-5 text-center text-xs text-muted">
        © 2026 bilimdibol · Онлайн-школа английского языка
      </footer>
    </div>
  );
}
