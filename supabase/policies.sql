-- =============================================================
-- bilimdibol — DRAFT Row Level Security (RLS) policies
-- Apply AFTER schema.sql + seed.sql, once you go to production.
-- =============================================================
-- Model (demo-grade, a safe starting point):
--   • RLS is ENABLED on every app table.
--   • Authenticated users (signed in via Supabase Auth) can read/write.
--   • The anon key alone (no session) gets NO access — the app requires login.
--   • The service_role key (server / scripts) bypasses RLS automatically.
--
-- TIGHTEN LATER per role: e.g. only accountant can write payroll/finance,
-- hunters see only their own leads/deals (using auth.jwt() -> user_metadata.role
-- or a join to users by auth.uid()). Left permissive here on purpose so the
-- demo keeps working the moment you connect Supabase.
-- =============================================================

do $$
declare
  t text;
  app_tables text[] := array[
    'users','leads','deals','deal_activities','calls','call_analysis','messages',
    'bot_flows','bot_nodes','bot_edges','integration_events','creative_analytics',
    'marketing_attribution','smm_content_plan','clients','sales','trials',
    'attendance','contracts','funnels','ad_campaigns','ad_spend',
    'finance_operations','payroll'
  ];
begin
  foreach t in array app_tables loop
    -- enable RLS
    execute format('alter table if exists %I enable row level security;', t);

    -- read access for authenticated users
    execute format($f$
      drop policy if exists "auth read %1$s" on %1$I;
      create policy "auth read %1$s" on %1$I
        for select to authenticated using (true);
    $f$, t);

    -- write access for authenticated users (insert / update / delete)
    execute format($f$
      drop policy if exists "auth write %1$s" on %1$I;
      create policy "auth write %1$s" on %1$I
        for all to authenticated using (true) with check (true);
    $f$, t);
  end loop;
end $$;

-- -------------------------------------------------------------
-- Example of a TIGHTER policy (commented — enable when ready):
-- Only accountants/admins may modify payroll.
-- -------------------------------------------------------------
-- drop policy if exists "auth write payroll" on payroll;
-- create policy "accountant write payroll" on payroll
--   for all to authenticated
--   using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('accountant','admin') )
--   with check ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('accountant','admin') );
