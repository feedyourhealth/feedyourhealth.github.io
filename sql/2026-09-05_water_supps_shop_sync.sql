-- Same fix as 2026-09-05_meal_checkin_sync.sql, extended to the other 3 places the
-- client portal (plan.html) only ever kept state in the browser's own localStorage
-- with nothing on the server to restore it from: water glasses, supplement check-off,
-- and the shopping-list checkmarks. Run once in the Supabase SQL editor for this
-- project. Not applied automatically — the app has no DB/infra credentials, this is a
-- manual migration step.
--
-- Three small dedicated tables + 6 SECURITY DEFINER RPCs, same no-login pattern as
-- get_shared_plan/submit_checkin/save_meal_checkin. Water and supplements are per-day
-- (like meals — the Πλάνο/supps tabs let the client check off any day of the current
-- week, not just today); the shopping list has no date dimension at all — it's one
-- flat, ongoing checklist — so it gets a single row per token instead.

-- ── Water (fyh_portal_<token>_water: {"YYYY-MM-DD": glassesCount}) ─────────────────
create table if not exists client_water_log (
  token       text not null,
  date        date not null,
  glasses     integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (token, date)
);
alter table client_water_log enable row level security;
revoke all on table client_water_log from anon;
grant select on table client_water_log to authenticated;

create or replace function save_water_checkin(p_token text, p_date date, p_glasses integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_glasses is null or p_glasses < 0 then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into client_water_log (token, date, glasses, updated_at)
  values (p_token, p_date, p_glasses, now())
  on conflict (token, date) do update
    set glasses = excluded.glasses, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

create or replace function get_water_checkins(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(date::text, glasses), '{}'::jsonb)
  from client_water_log
  where token = p_token
    and date >= (current_date - interval '60 days');
$$;

-- ── Supplements (fyh_portal_<token>_supps: {"YYYY-MM-DD": {"<supp name>": true}}) ──
create table if not exists client_supp_log (
  token       text not null,
  date        date not null,
  supps_map   jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (token, date)
);
alter table client_supp_log enable row level security;
revoke all on table client_supp_log from anon;
grant select on table client_supp_log to authenticated;

create or replace function save_supp_checkin(p_token text, p_date date, p_supps_map jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_supps_map is null or jsonb_typeof(p_supps_map) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into client_supp_log (token, date, supps_map, updated_at)
  values (p_token, p_date, p_supps_map, now())
  on conflict (token, date) do update
    set supps_map = excluded.supps_map, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

create or replace function get_supp_checkins(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(date::text, supps_map), '{}'::jsonb)
  from client_supp_log
  where token = p_token
    and date >= (current_date - interval '60 days');
$$;

-- ── Shopping list (fyh_portal_<token>_shop: {"<item name>": true}, no date) ────────
create table if not exists client_shop_log (
  token       text primary key,
  checks      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table client_shop_log enable row level security;
revoke all on table client_shop_log from anon;
grant select on table client_shop_log to authenticated;

create or replace function save_shop_state(p_token text, p_checks jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_checks is null or jsonb_typeof(p_checks) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into client_shop_log (token, checks, updated_at)
  values (p_token, p_checks, now())
  on conflict (token) do update
    set checks = excluded.checks, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

create or replace function get_shop_state(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select checks from client_shop_log where token = p_token),
    '{}'::jsonb
  );
$$;

grant execute on function save_water_checkin(text, date, integer) to anon;
grant execute on function get_water_checkins(text)                 to anon;
grant execute on function save_supp_checkin(text, date, jsonb)     to anon;
grant execute on function get_supp_checkins(text)                  to anon;
grant execute on function save_shop_state(text, jsonb)             to anon;
grant execute on function get_shop_state(text)                     to anon;

notify pgrst, 'reload schema';
