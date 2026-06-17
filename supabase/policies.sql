-- =============================================================
-- bilimdibol — Row Level Security (RLS) под роли
-- Запусти в Supabase → SQL Editor после schema.sql + seed.sql.
-- Идемпотентно: можно прогонять повторно.
-- =============================================================
-- Модель:
--   • RLS включён на всех таблицах; анонимный доступ закрыт.
--   • ЧТЕНИЕ — любому авторизованному сотруднику (дашборды и кабинеты
--     тянут несколько таблиц сразу, поэтому чтение общее).
--   • ЗАПИСЬ (insert/update/delete) — только разрешённым ролям.
--   • service_role (серверные скрипты) обходит RLS автоматически.
-- Роль берётся из JWT: user_metadata.role (проставляется seed-auth.mjs).
-- =============================================================

-- Хелпер: текущая роль пользователя из JWT
create or replace function app_role() returns text
  language sql stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')
$$;

do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('users',                 'admin'),
      ('leads',                 'admin,rop,hunter,manager'),
      ('deals',                 'admin,rop,hunter,manager'),
      ('deal_activities',       'admin,rop,hunter,manager'),
      ('calls',                 'admin,rop,hunter,manager'),
      ('call_analysis',         'admin,rop,hunter,manager'),
      ('messages',              'admin,rop,hunter,manager,smm'),
      ('bot_flows',             'admin,smm'),
      ('bot_nodes',             'admin,smm'),
      ('bot_edges',             'admin,smm'),
      ('integration_events',    'admin'),
      ('creative_analytics',    'admin,target,marketer'),
      ('marketing_attribution', 'admin,target,marketer'),
      ('smm_content_plan',      'admin,smm,content,marketer'),
      ('clients',               'admin,rop,manager'),
      ('sales',                 'admin,rop,manager,accountant'),
      ('trials',                'admin,rop,hunter,manager'),
      ('attendance',            'admin,rop,hunter,manager,target,accountant,content,marketer,smm'),
      ('contracts',             'admin,accountant,rop'),
      ('funnels',               'admin,target,marketer,content'),
      ('ad_campaigns',          'admin,target,marketer'),
      ('ad_spend',              'admin,target,marketer'),
      ('finance_operations',    'admin,accountant'),
      ('payroll',               'admin,accountant')
    ) as t(tbl, roles)
  loop
    execute format('alter table if exists %I enable row level security;', rec.tbl);

    -- убрать старые политики (v1 + текущие имена), чтобы не дублировались
    execute format('drop policy if exists "auth read %1$s" on %1$I;', rec.tbl);
    execute format('drop policy if exists "auth write %1$s" on %1$I;', rec.tbl);
    execute format('drop policy if exists "%1$s read" on %1$I;', rec.tbl);
    execute format('drop policy if exists "%1$s write" on %1$I;', rec.tbl);

    -- чтение: любой авторизованный
    execute format(
      'create policy "%1$s read" on %1$I for select to authenticated using (true);',
      rec.tbl
    );

    -- запись: только разрешённые роли
    execute format(
      'create policy "%1$s write" on %1$I for all to authenticated '
      || 'using (app_role() = any (string_to_array(%2$L, '','')) ) '
      || 'with check (app_role() = any (string_to_array(%2$L, '','')) );',
      rec.tbl, rec.roles
    );
  end loop;
end $$;
