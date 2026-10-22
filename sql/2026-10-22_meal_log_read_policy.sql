-- 🔄 Αντικαταστάσεις γευμάτων: ο διαιτολόγος έβλεπε ΠΑΝΤΑ 0 (βρέθηκε live 2026-10-22).
-- Run once in the Supabase SQL editor for this project. Safe to re-run.
--
-- Root cause: 2026-09-05_meal_checkin_sync.sql turned on RLS for client_meal_log and gave
-- `authenticated` a GRANT SELECT — but no RLS policy. With RLS on and no policy, Postgres
-- returns zero rows (no error), so Cloud.refreshMealLogCache() got [] for every client even
-- though plan.html's save_meal_checkin RPC (SECURITY DEFINER) was writing rows fine.
--
-- Fix: the dietitian may read the meal-log rows of links THEY published (shared_plans.dietitian_id).
-- anon stays fully locked out (revoked in the original migration) — the client still goes
-- only through save_meal_checkin / get_meal_checkins.

drop policy if exists "dietitian reads own clients meal log" on client_meal_log;
create policy "dietitian reads own clients meal log"
  on client_meal_log
  for select
  to authenticated
  using (exists (
    select 1 from shared_plans sp
    where sp.token = client_meal_log.token
      and sp.dietitian_id = auth.uid()
  ));

notify pgrst, 'reload schema';
