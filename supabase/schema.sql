-- =============================================================
-- bilimdibol — DRAFT Supabase schema (stage 2)
-- Not applied automatically. Reference for the future backend.
-- All tables scoped by project_id to allow multiple projects.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Roles enum ----------
do $$ begin
  create type role_id as enum (
    'admin','rop','target','hunter','manager','accountant','content','marketer','smm'
  );
exception when duplicate_object then null; end $$;

-- ---------- users ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  login text unique not null,
  -- store password hashes only (never plaintext) — handled by Supabase Auth in prod
  role role_id not null,
  email text,
  phone text,
  avatar_color text,
  created_at timestamptz not null default now()
);

-- ---------- leads ----------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  phone text,
  email text,
  instagram text,
  source text,
  hunter_id uuid references users(id),
  status text not null default 'new',
  next_touch timestamptz,
  comment text,
  utm_campaign text,
  creative_id text,
  created_at timestamptz not null default now()
);

-- ---------- deals (CRM pipeline) ----------
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  lead_id uuid references leads(id),
  client_name text not null,
  phone text,
  source text,
  amount numeric default 0,
  hunter_id uuid references users(id),
  manager_id uuid references users(id),
  stage text not null default 'new',
  next_step text,
  next_touch timestamptz,
  quality text,            -- hot | warm | cold
  probability int default 0,
  comment text,
  utm_campaign text,
  creative_id text,
  contract_status text,
  receipt_status text,
  created_at timestamptz not null default now()
);

-- ---------- deal_activities (history / tasks / notes) ----------
create table if not exists deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  type text not null,      -- note | task | call | message | stage_change
  author_id uuid references users(id),
  text text,
  due timestamptz,
  done boolean default false,
  created_at timestamptz not null default now()
);

-- ---------- calls ----------
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  employee_id uuid references users(id),
  deal_id uuid references deals(id),
  client_name text,
  duration_sec int,
  language text,           -- ru | kz | mixed
  status text default 'pending', -- pending | analyzing | done
  score int,
  result text,
  audio_url text,
  transcript jsonb,        -- [{speaker, text}]
  created_at timestamptz not null default now()
);

-- ---------- call_analysis ----------
create table if not exists call_analysis (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references calls(id) on delete cascade,
  summary text,
  checklist jsonb,         -- 9 boolean items
  score int,
  recommendations jsonb,   -- string[]
  detected_language text,
  model text default 'deepseek-v4-pro',
  created_at timestamptz not null default now()
);

-- ---------- messages (omni-channel inbox) ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  channel text not null,   -- instagram | messenger | whatsapp
  external_id text,
  deal_id uuid references deals(id),
  direction text not null, -- in | out
  body text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------- bot_flows / bot_nodes / bot_edges ----------
create table if not exists bot_flows (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  channel text not null,   -- instagram | messenger | whatsapp
  active boolean default true,
  description text,
  -- aggregated stats (could later be a view over runs)
  runs int default 0,
  replies int default 0,
  phones int default 0,
  trials int default 0,
  handoffs int default 0,
  conversion numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists bot_nodes (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references bot_flows(id) on delete cascade,
  type text not null,      -- message | question | buttons | condition | collect_phone | book_trial | handoff | tag | delay | webhook
  title text,
  text text,
  options jsonb,
  config jsonb,
  position int default 0
);

create table if not exists bot_edges (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references bot_flows(id) on delete cascade,
  from_node uuid references bot_nodes(id) on delete cascade,
  to_node uuid references bot_nodes(id) on delete cascade,
  label text
);

-- ---------- integration_events ----------
create table if not exists integration_events (
  id uuid primary key default gen_random_uuid(),
  channel text not null,   -- instagram | messenger | whatsapp | meta-capi | deepseek | supabase | vercel
  type text not null,
  payload jsonb,
  status text default 'ok', -- ok | pending | failed
  created_at timestamptz not null default now()
);

-- ---------- creative_analytics ----------
create table if not exists creative_analytics (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  platform text,           -- Meta | TikTok | YouTube | Google
  campaign text,
  views int default 0,
  clicks int default 0,
  ctr numeric default 0,
  leads int default 0,
  cpl numeric default 0,
  trials int default 0,
  sales int default 0,
  conversion numeric default 0,
  revenue numeric default 0,
  roas numeric default 0,
  lead_quality int default 0,
  recommendation text,     -- scale | keep | stop | change_offer | change_audience | new_hook
  period_start date,
  period_end date
);

-- ---------- marketing_attribution ----------
create table if not exists marketing_attribution (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  lead_id uuid references leads(id),
  client_name text,
  first_touch_source text,
  last_touch_source text,
  assisted_source text,
  utm_campaign text,
  creative_id text,
  confidence_score int default 0,
  converted boolean default false,
  created_at timestamptz not null default now()
);

-- ---------- smm_content_plan ----------
create table if not exists smm_content_plan (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  topic text not null,
  format text,             -- Instagram post | Stories | Reels | TikTok | YouTube Shorts
  rubric text,
  goal text,
  offer text,
  cta text,
  hook text,
  status text default 'idea', -- idea | planned | in_progress | published
  publish_date timestamptz,
  author_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- ---------- clients ----------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  phone text,
  email text,
  course text,
  manager_id uuid references users(id),
  total_paid numeric default 0,
  status text default 'Активный', -- Активный | Завершил | Пауза | Возврат
  progress int default 0,
  joined_at timestamptz not null default now()
);

-- ---------- sales ----------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  client_name text not null,
  course text,
  amount numeric default 0,
  method text,             -- Kaspi | Наличные | Банк | Рассрочка | Halyk | Forte
  manager_id uuid references users(id),
  hunter_id uuid references users(id),
  receipt_status text default 'pending', -- pending | confirmed | rejected
  contract_status text default 'Черновик',
  capi_sent boolean default false,
  installment boolean default false,
  created_at timestamptz not null default now()
);

-- ---------- trials (пробные уроки) ----------
create table if not exists trials (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  client_name text not null,
  datetime timestamptz not null,
  hunter_id uuid references users(id),
  manager_id uuid references users(id),
  status text default 'scheduled', -- scheduled | completed | no_show | rescheduled | bought | rejected
  result text,
  offered_course text,
  price numeric default 0,
  created_at timestamptz not null default now()
);

-- ---------- attendance (посещаемость) ----------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  employee_id uuid references users(id),
  date timestamptz not null default now(),
  check_in text,
  check_out text,
  status text default 'on_time', -- on_time | late | absent | remote | day_off
  comment text,
  lat numeric,   -- координаты отметки прихода (геозона офиса)
  lng numeric
);

-- ---------- contracts (договоры) ----------
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  type text not null,
  party text,              -- client or employee name
  status text default 'draft', -- draft | sent | signed | rejected
  created_at timestamptz not null default now(),
  signed_at timestamptz
);

-- ---------- funnels (воронки / ресурсы) ----------
create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  name text not null,
  url text,
  source text,
  type text,               -- Quiz | Landing | Instagram | TikTok | YouTube | WhatsApp
  visitors int default 0,
  leads int default 0,
  conversion numeric default 0,
  cpl numeric default 0,
  sales int default 0,
  revenue numeric default 0
);

-- ---------- ad_campaigns ----------
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  platform text,           -- Meta | TikTok | YouTube | Google
  name text not null,
  budget_usd numeric default 0,
  budget_kzt numeric default 0,
  leads int default 0,
  cpl_usd numeric default 0,
  cpl_kzt numeric default 0,
  sales int default 0,
  revenue_kzt numeric default 0,
  romi numeric default 0,
  recommendation text
);

-- ---------- ad_spend (daily) ----------
create table if not exists ad_spend (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  date timestamptz not null default now(),
  platform text,
  spend_usd numeric default 0,
  spend_kzt numeric default 0,
  leads int default 0
);

-- ---------- finance_operations ----------
create table if not exists finance_operations (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  date timestamptz not null default now(),
  category text,
  type text,               -- income | expense
  amount numeric default 0,
  responsible text,
  comment text
);

-- ---------- payroll ----------
create table if not exists payroll (
  id uuid primary key default gen_random_uuid(),
  project_id text not null default 'english-course',
  employee_id uuid references users(id),
  role role_id,
  base_salary numeric default 0,
  kpi_percent int default 0,
  sales_count int default 0,
  bonus numeric default 0,
  attendance_score int default 0,
  bonus_adjustment numeric default 0,
  total numeric default 0,
  status text default 'accrued', -- accrued | review | paid
  period text
);

-- ---------- helpful indexes ----------
create index if not exists idx_leads_project on leads(project_id);
create index if not exists idx_deals_stage on deals(project_id, stage);
create index if not exists idx_calls_employee on calls(employee_id);
create index if not exists idx_messages_channel on messages(project_id, channel);
create index if not exists idx_attr_project on marketing_attribution(project_id);
create index if not exists idx_clients_project on clients(project_id);
create index if not exists idx_sales_project on sales(project_id, receipt_status);
create index if not exists idx_trials_status on trials(project_id, status);
create index if not exists idx_attendance_emp on attendance(employee_id, date);
create index if not exists idx_contracts_status on contracts(project_id, status);
create index if not exists idx_funnels_project on funnels(project_id);
create index if not exists idx_ad_campaigns_project on ad_campaigns(project_id);
create index if not exists idx_ad_spend_date on ad_spend(project_id, date);
create index if not exists idx_finance_ops_date on finance_operations(project_id, date);
create index if not exists idx_payroll_emp on payroll(employee_id);
