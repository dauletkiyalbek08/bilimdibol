-- Настройки приложения (геозона офиса). Выполнить один раз в Supabase → SQL Editor.
create table if not exists app_settings (
  project_id text primary key default 'english-course',
  office_lat numeric,
  office_lng numeric,
  office_radius_m int default 250,
  updated_at timestamptz not null default now()
);

-- значение по умолчанию (текущий тестовый офис)
insert into app_settings (project_id, office_lat, office_lng, office_radius_m)
values ('english-course', 43.32329, 77.016375, 250)
on conflict (project_id) do nothing;

-- RLS: читают все авторизованные, меняет только админ
alter table app_settings enable row level security;
drop policy if exists "app_settings read" on app_settings;
create policy "app_settings read" on app_settings for select to authenticated using (true);
drop policy if exists "app_settings write" on app_settings;
create policy "app_settings write" on app_settings for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
