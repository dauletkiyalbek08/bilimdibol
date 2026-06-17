"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, GraduationCap, Clock, Globe } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const COURSES = [
  "General English",
  "IELTS",
  "Английский для работы",
  "Разговорный (Speaking Club)",
  "Для путешествий",
];

const BENEFITS = [
  { icon: GraduationCap, text: "Бесплатный пробный урок с преподавателем" },
  { icon: Clock, text: "Гибкое расписание — утром, днём или вечером" },
  { icon: Globe, text: "Speaking-first методика: говоришь с первого занятия" },
];

export default function LandingPage() {
  const [form, setForm] = React.useState({ name: "", phone: "", course: COURSES[0], comment: "" });
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/leads/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          comment: `Интересует: ${form.course}${form.comment ? ` · ${form.comment}` : ""}`,
          source: utm.utm_source || "Landing Page",
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
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand to-brand-600 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-accent-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <Logo size={40} textClassName="text-white" className="[&_span]:text-white" />
            <h1 className="mt-10 text-4xl font-bold leading-tight sm:text-5xl">
              Английский, на котором ты <span className="text-accent-yellow">заговоришь</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/85">
              Запишись на бесплатный пробный урок в bilimdibol — подберём программу под твою цель и уровень.
            </p>
            <ul className="mt-8 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                    <b.icon className="size-4.5" />
                  </span>
                  <span className="text-white/90">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="flex items-start lg:justify-end">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-ink shadow-pop">
              {status === "done" ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CheckCircle2 className="size-14 text-brand" />
                  <h2 className="mt-4 text-xl font-bold">Заявка принята!</h2>
                  <p className="mt-2 text-sm text-muted">
                    Мы свяжемся с вами в ближайшее время и запишем на бесплатный пробный урок.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => setStatus("idle")}>
                    Отправить ещё одну
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">Бесплатный пробный урок</h2>
                    <p className="mt-1 text-sm text-muted">Оставь заявку — перезвоним за 15 минут</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Имя</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Как вас зовут?" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Телефон</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 ___ ___ __ __" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Что интересует</label>
                    <Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                      {COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
                    {status === "sending" ? "Отправляем…" : <>Записаться на пробный <ArrowRight /></>}
                  </Button>
                  {status === "error" && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      Не удалось отправить. Попробуйте ещё раз или напишите нам в WhatsApp.
                    </p>
                  )}
                  <p className="text-center text-xs text-muted">
                    Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted">
        © 2026 bilimdibol · Онлайн-школа английского языка
      </footer>
    </div>
  );
}
