-- Миграция: координаты геолокации для отметки посещаемости.
-- Выполнить один раз в Supabase → SQL Editor (для уже созданной БД).
alter table attendance add column if not exists lat numeric;
alter table attendance add column if not exists lng numeric;
