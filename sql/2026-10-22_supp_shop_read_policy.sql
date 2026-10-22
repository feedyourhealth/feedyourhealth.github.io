-- 💊 Συμπληρώματα + 🛒 λίστα αγορών στην Πρόοδο: ίδιο κενό με το client_meal_log (2026-10-22).
-- Run once in the Supabase SQL editor for this project. Safe to re-run.
--
-- 2026-09-05_water_supps_shop_sync.sql turned on RLS for client_supp_log / client_shop_log with a
-- GRANT SELECT to authenticated but no policy, so a direct select from the app returns zero rows.
-- Same fix as 2026-10-22_meal_log_read_policy.sql: the dietitian reads only rows of links THEY
-- published (shared_plans.dietitian_id). anon stays locked out — the client still goes only
-- through the SECURITY DEFINER save_* / get_* RPCs.

drop policy if exists "dietitian reads own clients supp log" on client_supp_log;
create policy "dietitian reads own clients supp log"
  on client_supp_log
  for select
  to authenticated
  using (exists (
    select 1 from shared_plans sp
    where sp.token = client_supp_log.token
      and sp.dietitian_id = auth.uid()
  ));

drop policy if exists "dietitian reads own clients shop log" on client_shop_log;
create policy "dietitian reads own clients shop log"
  on client_shop_log
  for select
  to authenticated
  using (exists (
    select 1 from shared_plans sp
    where sp.token = client_shop_log.token
      and sp.dietitian_id = auth.uid()
  ));

notify pgrst, 'reload schema';
