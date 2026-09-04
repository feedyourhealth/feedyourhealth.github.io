-- Independent "measurements" share link (Έντυπο Λιπομέτρησης → live link instead of PDF).
-- Run this once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step.
--
-- Data model, same spirit as client_intake / shared_plans:
--   * lipo_snapshots = one row per client with an active measurements link. The
--     authenticated dietitian reads/writes their own rows directly (RLS, like
--     custom_recipes / client_intake).
--   * The client (anonymous, no login, metriseis.html) never touches the table
--     directly — only through the read-only get_lipo_snapshot RPC, exactly like
--     intake.html uses get_intake.
--   * Deliberately INDEPENDENT from shared_plans: its own token, so it can be
--     revoked/rotated without touching the client's diet-plan link, and it works
--     even for a client with no plan at all.
--   * Small payload by design — weightLog history + a handful of scalars, NOT the
--     week plan, shopping list or messages. See [[dietologist-lipometria-report-redesign]].
--   * No expiry (unlike shared_plans' 50-day window) — the whole point is a link
--     the dietitian never has to resend; each new measurement just republishes in
--     place (upsert by token). "🔄 Νέο link" in the app deletes the row + clears
--     the token so the next publish creates a fresh one.

create table if not exists lipo_snapshots (
  id            uuid primary key default gen_random_uuid(),
  dietitian_id  uuid references auth.users not null,
  client_id     text not null,                          -- c.id in the app ("c" + Date.now())
  client_name   text not null default '',
  token         text not null unique,                   -- genSecureToken(), the ?t= in the link
  lang          text not null default 'el'
                  check (lang in ('el','en','ru','tr')),
  snapshot      jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table lipo_snapshots enable row level security;

-- HARD lock for the anonymous client: metriseis.html ships the public anon key, so the
-- anon role must never touch this table directly (a plain `select * from lipo_snapshots`
-- would otherwise dump every dietitian's client measurements). It reaches the data ONLY
-- through the get_lipo_snapshot RPC below, which runs as the function owner and is
-- unaffected by this revoke. Supabase's default grants hand anon/authenticated table
-- privileges on every new public table, so we take them back from anon explicitly.
revoke all on table lipo_snapshots from anon;
grant  select, insert, update, delete on table lipo_snapshots to authenticated;

-- The dietitian (authenticated) can see / insert / update / delete only their own rows.
-- (drop-then-create so the whole file is safe to re-run.)
drop policy if exists "dietitian manages own lipo rows" on lipo_snapshots;
create policy "dietitian manages own lipo rows"
  on lipo_snapshots
  for all
  to authenticated
  using (dietitian_id = auth.uid())
  with check (dietitian_id = auth.uid());

create index if not exists lipo_snapshots_dietitian_id_idx on lipo_snapshots(dietitian_id);
create index if not exists lipo_snapshots_client_id_idx     on lipo_snapshots(client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC — what metriseis.html calls on load. Returns only what the report needs; never
-- the dietitian_id or client_id.
create or replace function get_lipo_snapshot(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'client_name', ls.client_name,
    'lang',        ls.lang,
    'snapshot',    ls.snapshot,
    'updated_at',  ls.updated_at
  )
  from lipo_snapshots ls
  where ls.token = p_token
  limit 1;
$$;

grant execute on function get_lipo_snapshot(text) to anon;

-- Force PostgREST to pick up the new table/RPC immediately (otherwise the first calls
-- from metriseis.html fail with PGRST202 "function not found in the schema cache" until
-- the cache refreshes on its own).
notify pgrst, 'reload schema';
