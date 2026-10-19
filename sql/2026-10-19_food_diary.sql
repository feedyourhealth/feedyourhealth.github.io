-- 📒 Ημερολόγιο φαγητού (imerologio.html).
-- Run this once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step. Safe to re-run.
--
-- Data model, same spirit as client_intake:
--   * food_diary = one row per diary the dietitian sends (a 4-week window from start_date).
--     The authenticated dietitian reads/writes their own rows directly (RLS).
--   * The client (anonymous, no login) never touches the table directly — only through
--     two SECURITY DEFINER RPCs: get_food_diary (read) and save_food_diary_day (write ONE day).
--   * entries   = client-written  {"YYYY-MM-DD": {"meals":{"breakfast":"…",…}, "feel":0|1|2, "at":ts}}
--     comments  = dietitian-written {"YYYY-MM-DD|breakfast": {"r":"👍","t":"…","at":ts}} — shown to the client
--     notes     = dietitian-only  {"0":"…","1":"…"} per week index — NEVER returned to the client
--   * status: 'active' → 'ended' (dietitian stops it) / 'superseded' (a new diary was sent).
--     Past start_date + weeks*7 days the RPCs treat an 'active' row as ended (read-only).

-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists food_diary (
  id             uuid primary key default gen_random_uuid(),
  dietitian_id   uuid references auth.users not null,
  client_id      text not null,                        -- c.id in the app
  client_name    text not null default '',
  token          text not null unique,                 -- genSecureToken(), the ?t= in the link
  status         text not null default 'active'
                   check (status in ('active','ended','superseded')),
  lang           text not null default 'el'
                   check (lang in ('el','en')),
  start_date     date not null,
  weeks          int  not null default 4 check (weeks between 1 and 8),
  entries        jsonb not null default '{}'::jsonb,
  comments       jsonb not null default '{}'::jsonb,
  notes          jsonb not null default '{}'::jsonb,
  sent_at        timestamptz not null default now(),
  last_entry_at  timestamptz,
  created_at     timestamptz not null default now()
);

alter table food_diary enable row level security;

-- HARD lock for the anonymous client (imerologio.html ships the public anon key).
revoke all on table food_diary from anon;
grant  select, insert, update, delete on table food_diary to authenticated;

drop policy if exists "dietitian manages own food diaries" on food_diary;
create policy "dietitian manages own food diaries"
  on food_diary
  for all
  to authenticated
  using (dietitian_id = auth.uid())
  with check (dietitian_id = auth.uid());

create index if not exists food_diary_dietitian_id_idx on food_diary(dietitian_id);
create index if not exists food_diary_client_id_idx    on food_diary(client_id);

-- "Today" for the diary = the clinic's local date (Cyprus), not UTC.
create or replace function food_diary_today()
returns date
language sql
stable
as $$ select (now() at time zone 'Asia/Nicosia')::date $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC 1 — what imerologio.html calls on load. Never returns dietitian_id, client_id or notes.
create or replace function get_food_diary(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'status',      case when fd.status = 'active'
                         and food_diary_today() > fd.start_date + fd.weeks * 7 - 1
                        then 'ended' else fd.status end,
    'lang',        fd.lang,
    'client_name', fd.client_name,
    'start_date',  fd.start_date,
    'weeks',       fd.weeks,
    'today',       food_diary_today(),
    'entries',     fd.entries,
    'comments',    fd.comments
  )
  from food_diary fd
  where fd.token = p_token
  limit 1;
$$;

-- RPC 2 — save ONE day (atomic per-day merge, so two days typed on two phones never clobber).
-- p_day = {"meals":{slot:text,…}, "feel":0|1|2|null}. An empty day removes the key.
-- Returns {ok:true} or {ok:false, reason:'not_found'|'ended'|'superseded'|'bad_date'|'bad_payload'|'too_large'}.
create or replace function save_food_diary_day(p_token text, p_date date, p_day jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  r       food_diary%rowtype;
  v_key   text := to_char(p_date, 'YYYY-MM-DD');
  v_empty boolean;
begin
  if p_day is null or jsonb_typeof(p_day) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if p_day ? 'meals' and jsonb_typeof(p_day->'meals') <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if pg_column_size(p_day) > 12000 then
    return json_build_object('ok', false, 'reason', 'too_large');
  end if;

  select * into r from food_diary where token = p_token limit 1 for update;
  if not found then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;
  if r.status <> 'active' then
    return json_build_object('ok', false, 'reason', r.status);
  end if;
  if food_diary_today() > r.start_date + r.weeks * 7 - 1 then
    return json_build_object('ok', false, 'reason', 'ended');
  end if;
  -- inside the window, and not in the future (+1 day slack for phones ahead of Cyprus time)
  if p_date is null or p_date < r.start_date or p_date > r.start_date + r.weeks * 7 - 1
     or p_date > food_diary_today() + 1 then
    return json_build_object('ok', false, 'reason', 'bad_date');
  end if;
  if pg_column_size(r.entries) > 400000 then
    return json_build_object('ok', false, 'reason', 'too_large');
  end if;

  v_empty := (p_day->'feel' is null or jsonb_typeof(p_day->'feel') = 'null')
             and not exists (select 1 from jsonb_each_text(coalesce(p_day->'meals','{}'::jsonb)) e
                             where btrim(coalesce(e.value,'')) <> '');

  if v_empty then
    update food_diary set entries = entries - v_key where id = r.id;
  else
    update food_diary
       set entries = jsonb_set(entries, array[v_key],
                               p_day || jsonb_build_object('at', now()), true),
           last_entry_at = now()
     where id = r.id;
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function get_food_diary(text)                    to anon;
grant execute on function save_food_diary_day(text, date, jsonb)  to anon;

-- Force PostgREST to pick up the new RPCs immediately.
notify pgrst, 'reload schema';
