"use client";

import * as React from "react";
import { ArrowRight, BarChart3, Users, Wallet, Megaphone, Lock, User2, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useApp } from "@/lib/store";
import { PROJECT, getRole } from "@/lib/roles";
import { DEMO_LOGINS } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const HIGHLIGHTS = [
  { icon: Users, label: "CRM-воронка вместо amoCRM" },
  { icon: BarChart3, label: "Анализ звонков и сквозная аналитика" },
  { icon: Megaphone, label: "Реклама, креативы и атрибуция" },
  { icon: Wallet, label: "Чат-бот вместо ChatPlace и интеграции" },
];

export default function LoginPage() {
  const { login, hydrated } = useApp();
  const [loginName, setLoginName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [showDemo, setShowDemo] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const ok = await login(loginName, password);
    setBusy(false);
    if (!ok) setError(true);
  }

  function quickFill(l: string, p: string) {
    setLoginName(l);
    setPassword(p);
    setError(false);
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand to-brand-600 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-accent-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-accent-orange/20 blur-3xl" />

        <Logo size={40} textClassName="text-white" className="[&_span]:text-white" />

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Операционная система вашей онлайн-школы</h1>
          <p className="mt-4 text-white/80">
            bilimdibol объединяет продажи, маркетинг, SMM, звонки и интеграции в одной платформе —
            постепенно заменяя amoCRM, ChatPlace и внешнюю аналитику.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h.label} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                  <h.icon className="size-4.5" />
                </span>
                <span className="text-sm text-white/90">{h.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© 2026 bilimdibol · Демо-версия платформы</p>
      </div>

      {/* Right login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size={36} />
          </div>

          <Badge variant="green" className="mb-4 gap-1.5">
            <span className="flex size-4 items-center justify-center rounded bg-brand text-[9px] font-bold text-white">
              {PROJECT.badge}
            </span>
            {PROJECT.name}
          </Badge>

          <h2 className="text-2xl font-bold text-ink">Вход в систему</h2>
          <p className="mt-1 text-sm text-muted">Введите логин и пароль сотрудника</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Логин</label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={loginName}
                  onChange={(e) => {
                    setLoginName(e.target.value);
                    setError(false);
                  }}
                  placeholder="например, admin"
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Пароль</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label="Показать пароль"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Неверный логин или пароль. Проверьте данные.
              </p>
            )}

            <Button size="lg" type="submit" className="w-full" disabled={!hydrated || busy}>
              {busy ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Вход…
                </>
              ) : (
                <>
                  Войти в систему
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials helper */}
          <div className="mt-5 rounded-xl border border-border bg-white">
            <button
              onClick={() => setShowDemo((s) => !s)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-ink"
            >
              <span>Демо-доступы ({DEMO_LOGINS.length})</span>
              <ChevronDown className={`size-4 text-muted transition-transform ${showDemo ? "rotate-180" : ""}`} />
            </button>
            {showDemo && (
              <div className="max-h-64 space-y-1 overflow-y-auto border-t border-border p-2">
                {DEMO_LOGINS.map((d) => (
                  <button
                    key={d.login}
                    onClick={() => quickFill(d.login, d.password)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-canvas"
                  >
                    <span>
                      <span className="font-medium text-ink">{d.name}</span>
                      <span className="ml-2 text-xs text-muted">{getRole(d.role).short}</span>
                    </span>
                    <code className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-muted">
                      {d.login} / {d.password}
                    </code>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Демо-доступ · данные сгенерированы и не являются реальными
          </p>
        </div>
      </div>
    </div>
  );
}
