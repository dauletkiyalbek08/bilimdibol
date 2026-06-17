# bilimdibol — демо-платформа управления онлайн-курсами

Внутренняя SaaS-платформа для образовательной компании, продающей онлайн-курсы английского языка.
Это **демо-версия**: данные по умолчанию сгенерированы (mock data), но вся работа с данными идёт
через слой `lib/data/*` — при подключении Supabase платформа прозрачно переходит на реальную БД.
Под интеграции (Meta CAPI, WhatsApp/Instagram, DeepSeek) подготовлены API-роуты и UI-заготовки.

## Документация
- [SUPABASE.md](SUPABASE.md) — подключение реальной БД и авторизации
- [DEPLOY.md](DEPLOY.md) — деплой на Vercel (чек-лист)

## Стек

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (премиум SaaS-дизайн в стиле shadcn/ui)
- **lucide-react** — иконки
- **Recharts** — графики
- **date-fns** — даты (таймзона Asia/Almaty)
- Mock data в TypeScript-файлах + mock API-слой

## Запуск локально

```bash
npm install
npm run dev
```

Откройте http://localhost:3000 — попадёте на страницу входа.
Вход по логину/паролю (демо-аккаунты в списке на странице входа), например `admin / admin2026`.

Сборка production-версии:

```bash
npm run build
npm start
```

## Демо-возможности

- 🔐 Вход по логину/паролю (9 ролей, demo-аккаунты), сессия в localStorage
- 🧭 Role-based навигация и контроль доступа к страницам
- 📅 Date Range Picker (Сегодня / 7 дней / месяц / свой период …) — меняет данные
- 👥 CRM лидов: фильтры, поиск, карточка лида, смена статуса, комментарии, назначение пробного
- 🎓 Пробные уроки, продажи с проверкой чеков (подтвердить/отклонить)
- 📣 Реклама (₸ и $), CAPI, ресурсы/воронки
- ✨ AI Studio: генерация связанного сценария из 4 видео с единым персонажем
- 💰 Финансы, зарплаты (с детализацией и «корректировкой бонуса»), посещаемость (приход/уход)
- 📄 Договоры, отчёты (PDF/Excel заглушки), права доступа, настройки
- 💾 Выбранная роль и период сохраняются в localStorage

## Структура

```
src/
├── app/
│   ├── layout.tsx              # root layout + AppProvider
│   ├── page.tsx                # login page
│   ├── globals.css
│   └── (dashboard)/            # защищённая зона с общим layout
│       ├── dashboard/          # Главная
│       ├── leads/ trials/ sales/ clients/
│       ├── hunter/ managers/
│       ├── advertising/ capi/ resources/ ai-studio/
│       ├── finance/ payroll/ attendance/ contracts/
│       └── reports/ settings/ permissions/
├── components/
│   ├── ui/                     # примитивы (button, card, badge, table, modal, …)
│   └── *.tsx                   # AppLayout, Sidebar, Topbar, MetricCard, DataTable, …
└── lib/
    ├── types.ts                # все доменные типы (User, Lead, Sale, …)
    ├── roles.ts                # роли, навигация, матрица прав
    ├── mock-data.ts            # сгенерированные данные
    ├── mock-api.ts             # сервис-слой (getLeads, getDashboardStats, …)
    ├── date-range.ts           # пресеты периодов
    ├── store.tsx               # контекст (роль, период, auth, localStorage)
    └── utils.ts                # форматирование ₸ / $ / дат
```

## Подготовка к backend

Типы и mock API-слой (`lib/mock-api.ts`) повторяют будущий слой данных Supabase —
сигнатуры функций (`getLeads`, `getSales`, `getDashboardStats`, …) можно сохранить,
заменив тела на реальные запросы. Поле `project_id = "english-course"` заложено для
будущего добавления других проектов.
