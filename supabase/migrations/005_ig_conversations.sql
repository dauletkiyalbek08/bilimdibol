-- Instagram Direct диалоги: состояние квалификации по каждому собеседнику.
create table if not exists ig_conversations (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text not null unique,   -- IGSID собеседника
  username text,
  state text not null default 'new', -- new | await_name | await_phone | done
  name text,
  phone text,
  lead_id uuid,
  last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ig_conversations_user_idx on ig_conversations (ig_user_id);

-- Доступ только сервера (service_role обходит RLS); публичных политик не даём.
alter table ig_conversations enable row level security;
