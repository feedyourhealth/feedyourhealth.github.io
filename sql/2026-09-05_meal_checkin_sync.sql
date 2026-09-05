-- Meal check-off sync (fixes: client-reported "όταν σημειώνω ότι έφαγα το μεσημεριανό,
-- μετά που ξαναμπαίνω φεύγει και το ξαναβάζω" — the check-off disappears on return).
-- Run once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step.
--
-- Root cause: plan.html only ever kept which meals a client checked "eaten" in the
-- browser's own localStorage (fyh_portal_<token>_meals, see getMealsFor/setMealsFor).
-- The only thing that ever reached Supabase was the aggregate count via submit_checkin
-- (checkins table, for the dietitian's tracker) — never WHICH meal was checked. Any
-- localStorage loss (a link reopened inside WhatsApp's in-app browser, private
-- browsing, clearing site data, a new device) wiped every check-off with nothing on
-- the server to restore it from.
--
-- Fix: a small dedicated table + 2 SECURITY DEFINER RPCs, same no-login pattern as
-- get_shared_plan/submit_checkin/submit_client_log/plan_feedback (see client_intake.sql
-- for the same pattern spelled out in more detail). Deliberately a NEW table rather
-- than touching the existing `checkins` table/RPC — that one only stores daily
-- aggregate counts for the dietitian's tracker view, its exact live signature isn't
-- reproduced in this repo, and there is no need to touch it for this fix.

create table if not exists client_meal_log (
  token       text not null,
  date        date not null,
  meals_map   jsonb not null default '{}'::jsonb,   -- {"0":true,"2":true} keyed by meal index (string) for that day
  updated_at  timestamptz not null default now(),
  primary key (token, date)
);

alter table client_meal_log enable row level security;

-- Same hard lock as client_intake: plan.html ships the public anon key, so anon must
-- never touch this table directly — only through the SECURITY DEFINER RPCs below.
revoke all on table client_meal_log from anon;
-- Blanket read for the dietitian's own (single-tenant) session, mirroring checkins/client_logs.
grant select on table client_meal_log to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC 1 — plan.html calls this (debounced) after every check-off tap. Writes only
-- when the token still resolves to a live shared plan.
create or replace function save_meal_checkin(p_token text, p_date date, p_meals_map jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_meals_map is null or jsonb_typeof(p_meals_map) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into client_meal_log (token, date, meals_map, updated_at)
  values (p_token, p_date, p_meals_map, now())
  on conflict (token, date) do update
    set meals_map = excluded.meals_map, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

-- RPC 2 — plan.html calls this on boot() and refreshPlan() to hydrate its local cache
-- with the durable, cloud-backed truth. Capped to the last 60 days — a per-day map is
-- a handful of booleans, so this stays tiny even after months of use.
create or replace function get_meal_checkins(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(date::text, meals_map), '{}'::jsonb)
  from client_meal_log
  where token = p_token
    and date >= (current_date - interval '60 days');
$$;

grant execute on function save_meal_checkin(text, date, jsonb) to anon;
grant execute on function get_meal_checkins(text)               to anon;

-- Force PostgREST to pick up the two new RPCs immediately (otherwise the first calls
-- from plan.html fail with PGRST202 "function not found in the schema cache" until
-- the cache refreshes on its own).
notify pgrst, 'reload schema';
