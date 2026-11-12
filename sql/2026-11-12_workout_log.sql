-- 🏃 Καταγραφή γυμναστικής από το link του πελάτη (plan.html, 2026-11-12).
-- Run once in the Supabase SQL editor for this project. Safe to re-run.
--
-- Ο πελάτης τσεκάρει στην Αρχική / στο Πλάνο αν έκανε την προγραμματισμένη προπόνηση της μέρας,
-- ή καταγράφει μια εξτρά προπόνηση σε μέρα χωρίς πρόγραμμα. Μία γραμμή ανά (token, ημέρα):
--   data = {"d":true}                      → έκανε την προγραμματισμένη
--   data = {"e":{"t":"run","m":45}}        → εξτρά (t = weights|run|walk|bike|swim|team|other, m = λεπτά ή null)
-- Κενό αντικείμενο {} = ο πελάτης το ξε-τσέκαρε → η γραμμή σβήνεται.
--
-- Ίδιο μοτίβο με το client_meal_log (2026-09-05_meal_checkin_sync.sql + 2026-10-22_meal_log_read_policy.sql):
-- anon δεν αγγίζει ποτέ τον πίνακα, μόνο μέσω των 2 SECURITY DEFINER RPC· ο διαιτολόγος διαβάζει
-- μόνο τις γραμμές των δικών του links (RLS policy πάνω στο shared_plans.dietitian_id).
-- Χωρίς αυτό το SQL το link δουλεύει κανονικά (κρατά τα τσεκ τοπικά), απλά δεν φτάνουν σε σένα.

create table if not exists client_workout_log (
  token       text not null,
  date        date not null,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (token, date)
);

alter table client_workout_log enable row level security;
revoke all on table client_workout_log from anon;
grant select on table client_workout_log to authenticated;

drop policy if exists "dietitian reads own clients workout log" on client_workout_log;
create policy "dietitian reads own clients workout log"
  on client_workout_log
  for select
  to authenticated
  using (exists (
    select 1 from shared_plans sp
    where sp.token = client_workout_log.token
      and sp.dietitian_id = auth.uid()
  ));

-- RPC 1 — plan.html, debounced μετά από κάθε τσεκ / καταγραφή εξτρά.
create or replace function save_workout_checkin(p_token text, p_date date, p_data jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_data = '{}'::jsonb then
    delete from client_workout_log where token = p_token and date = p_date;
  else
    insert into client_workout_log (token, date, data, updated_at)
    values (p_token, p_date, p_data, now())
    on conflict (token, date) do update
      set data = excluded.data, updated_at = now();
  end if;

  return json_build_object('ok', true);
end;
$$;

-- RPC 2 — plan.html στο boot()/refreshPlan(), για να «θεραπεύσει» το τοπικό cache. Τελευταίες 60 μέρες.
create or replace function get_workout_checkins(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(date::text, data), '{}'::jsonb)
  from client_workout_log
  where token = p_token
    and date >= (current_date - interval '60 days');
$$;

grant execute on function save_workout_checkin(text, date, jsonb) to anon;
grant execute on function get_workout_checkins(text)               to anon;

notify pgrst, 'reload schema';
