# Деплой bilimdibol на Vercel

Платформа — обычное Next.js 14 приложение, Vercel разворачивает его «из коробки».
Без переменных окружения прод тоже работает (mock-режим); с ключами — на реальном Supabase.

## 0. Перед деплоем (локально)
```bash
npm install
npm run build      # должно быть: ✓ Compiled successfully
```
Если билд зелёный — можно деплоить.

---

## Вариант A — через GitHub (рекомендуется)

### 1. Создать репозиторий и запушить
Проект пока не под git. В корне:
```bash
git init
git add .
git commit -m "bilimdibol demo platform"
git branch -M main
# создайте пустой репозиторий на github.com, затем:
git remote add origin https://github.com/<USERNAME>/bilimdibol.git
git push -u origin main
```
> `.gitignore` уже скрывает `node_modules`, `.next`, `.env*` — секреты в git не попадут.

### 2. Импортировать в Vercel
1. https://vercel.com → **Add New… → Project** → импорт вашего репозитория.
2. Framework Preset определится автоматически как **Next.js**.
3. Build Command: `next build` · Output: `.next` · Install: `npm install` (всё по умолчанию).
4. Не нажимайте Deploy сразу — сначала добавьте переменные (шаг 3).

---

## Вариант B — через Vercel CLI (без GitHub)
```bash
npm i -g vercel
vercel            # первый деплой (preview), ответьте на вопросы
vercel --prod     # продакшн
```
Переменные окружения добавляются в дашборде проекта или `vercel env add`.

---

## 3. Переменные окружения (Project → Settings → Environment Variables)
Минимум для работы — ничего (mock-режим). Для реальных данных и интеграций:

| Переменная | Значение | Зачем |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://<ваш-проект>.vercel.app` | Базовый URL (webhook-адреса на странице Интеграции) |
| `NEXT_PUBLIC_SUPABASE_URL` | из Supabase → API | БД и данные |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | из Supabase → API | Клиентский доступ |
| `SUPABASE_SERVICE_ROLE_KEY` | из Supabase → API | Серверные роуты / сиды (секрет!) |
| `DEEPSEEK_API_KEY` | из DeepSeek | AI-анализ звонков (иначе mock) |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | — |
| `DEEPSEEK_MODEL` | `deepseek-v4-pro` | — |
| `META_VERIFY_TOKEN` | `bilimdibol-demo-verify-token` | Верификация webhook Meta/WhatsApp |
| `META_APP_ID` / `META_APP_SECRET` | из Meta | CAPI / Instagram / Messenger |
| `META_PAGE_ACCESS_TOKEN` / `FACEBOOK_PAGE_ID` / `IG_BUSINESS_ACCOUNT_ID` | из Meta | — |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_BUSINESS_ACCOUNT_ID` | из Meta | WhatsApp Cloud API |

> Полный список — в [.env.example](.env.example). Выставляйте на окружения **Production** (и Preview при необходимости).
> После добавления/изменения переменных нажмите **Redeploy**.

---

## 4. После деплоя

1. **Supabase**: примените [supabase/schema.sql](supabase/schema.sql), [supabase/seed.sql](supabase/seed.sql),
   при необходимости [supabase/policies.sql](supabase/policies.sql); создайте аккаунты — `node scripts/seed-auth.mjs`
   (см. [SUPABASE.md](SUPABASE.md)). Индикатор в sidebar станет «Supabase».
2. **Webhook-адреса** (когда подключаете Meta/WhatsApp) — используйте продакшн-URL:
   - Meta / Instagram / Messenger / CAPI → `https://<проект>.vercel.app/api/webhooks/meta`
   - WhatsApp → `https://<проект>.vercel.app/api/webhooks/whatsapp`
   - Verify token → `bilimdibol-demo-verify-token`
3. **Проверка**: откройте `https://<проект>.vercel.app` и войдите (`admin / admin2026`).

---

## 5. Чек-лист готовности
- [ ] `npm run build` локально зелёный
- [ ] Репозиторий запушен (Вариант A) или `vercel --prod` (Вариант B)
- [ ] `NEXT_PUBLIC_APP_URL` указывает на прод-домен
- [ ] Supabase-переменные заданы (если нужны живые данные) + схема применена
- [ ] Секреты только в Environment Variables, не в коде
- [ ] Webhook-эндпоинты прописаны в Meta/WhatsApp с verify token
- [ ] Вход работает на проде
