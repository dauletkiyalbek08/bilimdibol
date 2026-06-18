-- Графики работы. Выполнить один раз в Supabase → SQL Editor.
create table if not exists schedules (
  employee_id uuid primary key references users(id) on delete cascade,
  weekdays int[] not null default '{1,2,3,4,5}', -- 1=Пн … 7=Вс
  start_time text not null default '09:00',
  end_time text not null default '18:00',
  updated_at timestamptz not null default now()
);

alter table schedules enable row level security;
drop policy if exists "schedules read" on schedules;
create policy "schedules read" on schedules for select to authenticated using (true);
drop policy if exists "schedules write" on schedules;
create policy "schedules write" on schedules for all to authenticated
  using (app_role() in ('admin','rop','marketer'))
  with check (app_role() in ('admin','rop','marketer'));
