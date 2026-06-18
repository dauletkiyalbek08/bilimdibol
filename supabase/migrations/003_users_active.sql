-- Деактивация сотрудников: флаг активности. Выполнить один раз в Supabase → SQL Editor.
alter table users add column if not exists active boolean not null default true;
