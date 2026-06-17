# Подключение Supabase к bilimdibol

Демо работает **без** Supabase (на mock-данных). Эта инструкция включает реальный
бэкенд: база данных + авторизация. Пока переменных окружения нет — всё автоматически
работает в mock-режиме, ничего не ломается.

## Как это устроено

- [src/lib/supabase/config.ts](src/lib/supabase/config.ts) — `isSupabaseConfigured` (есть ли ключи).
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) — браузерный клиент (anon key), `null` без ключей.
- [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts) — серверный клиент (service role), только для API-роутов.
- [src/lib/data/leads.ts](src/lib/data/leads.ts), [src/lib/data/deals.ts](src/lib/data/deals.ts) — слой данных: Supabase, иначе mock.
- Логин ([src/lib/store.tsx](src/lib/store.tsx)): при наличии ключей проверяет пароль через Supabase Auth, иначе mock.

Страница **Лиды** уже переведена на этот слой данных ([fetchLeads](src/lib/data/leads.ts)) —
используйте её как образец для остальных страниц.

## Шаги подключения

### 1. Создать проект Supabase
1. Зайдите на https://supabase.com → **New project**.
2. Запомните пароль БД. Дождитесь готовности проекта.
3. **Project Settings → API** — скопируйте:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` ключ → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` ключ → `SUPABASE_SERVICE_ROLE_KEY` (секрет!)

### 2. Применить схему и сид
1. **SQL Editor → New query**.
2. Вставьте содержимое [supabase/schema.sql](supabase/schema.sql) → **Run**.
3. Новым запросом вставьте [supabase/seed.sql](supabase/seed.sql) → **Run** (профили + примеры лидов/сделок).

### 3. Прописать ключи локально
Создайте файл `.env.local` в корне (он в `.gitignore`, в git не попадёт):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Создать аккаунты для входа
Логины/пароли те же, что в демо. Создайте соответствующие Auth-аккаунты:

```bash
node scripts/seed-auth.mjs
```

Скрипт прочитает `.env.local` и заведёт 12 пользователей (admin, rop, hunter1 … smm)
с теми же паролями. Вход в систему: логин → e-mail сопоставляется автоматически.

### 5. Запустить
```bash
npm run dev
```

Теперь:
- вход проверяется через Supabase Auth (`admin / admin2026` и т.д.);
- страница **Лиды** читает данные из таблицы `leads`, смена статуса пишется в БД;
- остальные страницы пока на mock — переключаются на слой данных по образцу Лидов.

## Деплой на Vercel
В **Project Settings → Environment Variables** добавьте те же переменные
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_APP_URL` = адрес продакшена). Без них прод тоже соберётся и будет работать в mock-режиме.

## Безопасность (RLS)
Перед продакшеном включите Row Level Security: в **SQL Editor** выполните
[supabase/policies.sql](supabase/policies.sql). Черновик включает RLS на всех таблицах
и даёт доступ только авторизованным пользователям (anon-ключ без входа данных не видит).
Внутри файла есть пример более строгой политики под роли (`user_metadata.role`).

## Что дальше
- Все страницы уже работают через слой данных `lib/data/*` — после подключения Supabase
  и применения `schema.sql` + `seed.sql` они автоматически читают живые данные.
- Ужесточить RLS под роли (пример в `policies.sql`).
- Вынести агрегаты дашбордов в Supabase RPC, если нужна серверная агрегация.
