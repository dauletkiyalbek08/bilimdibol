"use client";

import * as React from "react";
import { Building2, Bell, Plug, Users, Globe, Check, MapPin, Crosshair } from "lucide-react";
import { useApp } from "@/lib/store";
import { getRole, PROJECT } from "@/lib/roles";
import { EMPLOYEES } from "@/lib/mock-data";
import { fetchOfficeSettings, saveOfficeSettings } from "@/lib/data/settings";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";

const INTEGRATIONS = [
  { name: "Supabase", desc: "База данных и аутентификация", status: "Не подключено" },
  { name: "Telegram Bot", desc: "Уведомления и заявки", status: "Не подключено" },
  { name: "Meta CAPI", desc: "Server-side конверсии", status: "Не подключено" },
  { name: "Kaspi / Halyk", desc: "Приём платежей", status: "Не подключено" },
  { name: "AI Video API", desc: "Генерация видео в AI Studio", status: "Не подключено" },
];

export default function SettingsPage() {
  const { role, currentUserName } = useApp();
  const current = getRole(role);
  const [notifs, setNotifs] = React.useState({ leads: true, sales: true, payroll: false, reports: true });
  const [saved, setSaved] = React.useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" description="Параметры компании, профиля и интеграций">
        <Button onClick={save}>{saved ? <><Check /> Сохранено</> : "Сохранить изменения"}</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Company */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="size-4.5 text-brand" /> Компания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Название компании" value="bilimdibol" />
            <Field label="Проект" value={PROJECT.name} />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Валюта</label>
              <Select defaultValue="KZT">
                <option value="KZT">Тенге (₸)</option>
                <option value="USD">Доллар ($)</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Часовой пояс</label>
              <Select defaultValue="almaty">
                <option value="almaty">Asia/Almaty (UTC+5)</option>
                <option value="astana">Asia/Astana (UTC+5)</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="size-4.5 text-brand" /> Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={currentUserName} size="lg" />
              <div>
                <p className="font-semibold text-ink">{currentUserName}</p>
                <p className="text-sm text-muted">{current.name}</p>
              </div>
            </div>
            <Field label="Email" value="user@bilimdibol.kz" />
            <Field label="Телефон" value="+7 701 000 00 00" />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Язык интерфейса</label>
              <Select defaultValue="ru">
                <option value="ru">Русский</option>
                <option value="kz">Қазақша</option>
                <option value="en">English</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="size-4.5 text-brand" /> Уведомления</CardTitle>
            <CardDescription>Когда присылать оповещения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "leads" as const, label: "Новые лиды" },
              { key: "sales" as const, label: "Новые продажи и чеки" },
              { key: "payroll" as const, label: "Начисление зарплаты" },
              { key: "reports" as const, label: "Готовые отчёты" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm text-ink">{n.label}</span>
                <Switch checked={notifs[n.key]} onCheckedChange={(v) => setNotifs((p) => ({ ...p, [n.key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plug className="size-4.5 text-brand" /> Интеграции</CardTitle>
            <CardDescription>Будут подключены в рабочей версии</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {INTEGRATIONS.map((it) => (
              <div key={it.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-ink">{it.name}</p>
                  <p className="text-xs text-muted">{it.desc}</p>
                </div>
                <Badge variant="gray">{it.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Office geofence — только админ */}
      {role === "admin" && <OfficeGeoCard />}

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="size-4.5 text-brand" /> Команда</CardTitle>
          <CardDescription>{EMPLOYEES.length} сотрудников в проекте</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EMPLOYEES.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <UserAvatar name={e.name} color={e.avatarColor} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{e.name}</p>
                  <p className="truncate text-xs text-muted">{getRole(e.role).name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OfficeGeoCard() {
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [radius, setRadius] = React.useState("250");
  const [locating, setLocating] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [savingOffice, setSavingOffice] = React.useState(false);

  React.useEffect(() => {
    fetchOfficeSettings().then((o) => {
      setLat(String(o.lat));
      setLng(String(o.lng));
      setRadius(String(o.radiusM));
    });
  }, []);

  function useMyLocation() {
    setMsg(null);
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      setMsg({ ok: false, text: "Геолокация недоступна в этом браузере" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        setMsg({ ok: true, text: "Координаты подставлены из вашего местоположения" });
      },
      () => {
        setLocating(false);
        setMsg({ ok: false, text: "Не удалось определить местоположение — разрешите доступ" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save() {
    const la = Number(lat);
    const ln = Number(lng);
    const r = Number(radius);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || !r) {
      setMsg({ ok: false, text: "Проверьте координаты и радиус" });
      return;
    }
    setSavingOffice(true);
    const ok = await saveOfficeSettings({ lat: la, lng: ln, radiusM: r });
    setSavingOffice(false);
    setMsg(ok ? { ok: true, text: "Сохранено. Геозона применится при следующей отметке." } : { ok: false, text: "Не удалось сохранить (нужны права админа и применённая миграция)" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="size-4.5 text-brand" /> Геозона офиса</CardTitle>
        <CardDescription>Точка офиса и радиус для отметки «Пришёл». При переезде — просто измените здесь.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Широта (lat)</label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="43.323290" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Долгота (lng)</label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.016375" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Радиус, м</label>
            <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="250" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={useMyLocation} disabled={locating}>
            <Crosshair /> {locating ? "Определяем…" : "Моё текущее местоположение"}
          </Button>
          <Button onClick={save} disabled={savingOffice}>
            {savingOffice ? "Сохранение…" : "Сохранить геозону"}
          </Button>
        </div>
        {msg && (
          <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
        )}
        <p className="text-xs text-muted">
          Подсказка: чтобы задать новый офис — встаньте в нём и нажмите «Моё текущее местоположение», затем «Сохранить».
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <Input defaultValue={value} />
    </div>
  );
}
