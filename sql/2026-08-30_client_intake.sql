-- Intake questionnaire (Upgrades Phase 2).
-- Run this once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step.
--
-- Data model, same spirit as shared_plans + custom_recipes:
--   * client_intake  = one row per questionnaire the dietitian sends. The authenticated
--     dietitian reads/writes their own rows directly (RLS, like custom_recipes).
--   * The client (anonymous, no login) never touches the table directly — only through
--     two SECURITY DEFINER RPCs, exactly like plan.html uses get_shared_plan / submit_*.
--   * The link never expires. status goes 'sent' -> 'submitted' (one time, locked) and a
--     re-send flips the old row to 'superseded' and inserts a fresh one.

-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists client_intake (
  id            uuid primary key default gen_random_uuid(),
  dietitian_id  uuid references auth.users not null,
  client_id     text not null,                         -- c.id in the app ("c" + Date.now())
  client_name   text not null default '',
  token         text not null unique,                  -- genSecureToken(), the ?t= in the link
  status        text not null default 'sent'
                  check (status in ('sent','submitted','superseded')),
  lang          text not null default 'el'
                  check (lang in ('el','en')),
  prefill       jsonb not null default '{}'::jsonb,    -- {name, birthDate, heightCm} shown pre-filled in the form
  payload       jsonb,                                  -- the client's structured answers; null until submitted
  sent_at       timestamptz not null default now(),
  submitted_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table client_intake enable row level security;

-- The dietitian can see / insert / update / delete only their own rows.
-- (drop-then-create so the whole file is safe to re-run.)
drop policy if exists "dietitian manages own intake rows" on client_intake;
create policy "dietitian manages own intake rows"
  on client_intake
  for all
  using (dietitian_id = auth.uid())
  with check (dietitian_id = auth.uid());

create index if not exists client_intake_dietitian_id_idx on client_intake(dietitian_id);
create index if not exists client_intake_client_id_idx     on client_intake(client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC 1 — what intake.html calls on load. Returns only what the form needs; never
-- the dietitian_id, client_id or the previously submitted answers.
create or replace function get_intake(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'status',       ci.status,
    'lang',         ci.lang,
    'prefill',      ci.prefill,
    'client_name',  ci.client_name,
    'submitted_at', ci.submitted_at
  )
  from client_intake ci
  where ci.token = p_token
  limit 1;
$$;

-- RPC 2 — the one-time submit. Writes only when the row exists AND is still 'sent'.
-- Returns {ok:true} or {ok:false, reason:'not_found'|'submitted'|'superseded'|'too_large'}.
create or replace function submit_intake(p_token text, p_payload jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if pg_column_size(p_payload) > 60000 then
    return json_build_object('ok', false, 'reason', 'too_large');
  end if;

  select status into v_status from client_intake where token = p_token limit 1;
  if not found then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_status <> 'sent' then
    return json_build_object('ok', false, 'reason', v_status);   -- 'submitted' or 'superseded'
  end if;

  update client_intake
     set payload = p_payload,
         status = 'submitted',
         submitted_at = now()
   where token = p_token and status = 'sent';

  return json_build_object('ok', true);
end;
$$;

grant execute on function get_intake(text)             to anon;
grant execute on function submit_intake(text, jsonb)   to anon;

-- Force PostgREST to pick up the two new RPCs immediately (otherwise the first calls
-- from intake.html fail with PGRST202 "function not found in the schema cache" until
-- the cache refreshes on its own).
notify pgrst, 'reload schema';
