"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { FunnelOffer } from "@/lib/funnels-config";

export function OfferLanding({ offer }: { offer: FunnelOffer }) {
  const [form, setForm] = React.useState({ name: "", phone: "", course: offer.courses[0], comment: "" });
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
          comment: `${offer.title} → ${form.course}${form.comment ? ` · ${form.comment}` : ""}`,
          source: utm.utm_source || "Landing Page",
          utm_campaign: utm.utm_campaign || offer.slug,
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
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand to-brand-600 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-accent-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <Logo size={40} textClassName="text-white" className="[&_span]:text-white" />
            <Badge variant="yellow" className="mt-8">{offer.badge}</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              {offer.headlineStart} <span className="text-accent-yellow">{offer.headlineHighlight}</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/85">{offer.subtitle}</p>
            <ul className="mt-8 space-y-3">
              {offer.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-yellow" />
                  <span className="text-white/90">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start lg:justify-end">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-ink shadow-pop">
              {status === "done" ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CheckCircle2 className="size-14 text-brand" />
                  <h2 className="mt-4 text-xl font-bold">Заявка принята!</h2>
                  <p className="mt-2 text-sm text-muted">Свяжемся с вами в ближайшее время и запишем на бесплатный пробный урок.</p>
                  <Button className="mt-6" variant="outline" onClick={() => setStatus("idle")}>Отправить ещё одну</Button>
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
                    <label className="mb-1 block text-xs font-medium text-muted">Телефон / WhatsApp</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 ___ ___ __ __" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Что интересует</label>
                    <Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                      {offer.courses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
                    {status === "sending" ? "Отправляем…" : <>{offer.cta} <ArrowRight /></>}
                  </Button>
                  {status === "error" && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Не удалось отправить. Попробуйте ещё раз.</p>
                  )}
                  <p className="text-center text-xs text-muted">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted">© 2026 bilimdibol · Онлайн-школа английского языка</footer>
    </div>
  );
}
