-- Optimistic locking for user_data, so two tabs/devices saving concurrently can no longer
-- silently overwrite each other (see audit finding: whole-blob save + no write-time conflict
-- check, Cloud._pushNow() in Dietologist.html always did a blind upsert).
-- Run this once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step.

alter table user_data
  add column if not exists version integer not null default 1;

-- Cloud._pushNow() (Dietologist.html) now does:
--   UPDATE user_data SET data=..., version=version+1 WHERE user_id=? AND version=<last seen>
-- instead of a plain upsert. If that UPDATE matches zero rows, another tab/device already
-- saved a newer version — the app shows a "Φόρτωσε τα πιο πρόσφατα δεδομένα" banner
-- (Cloud._showConflictError / Cloud.forceReloadFromCloud) instead of overwriting it.
-- No RLS/table-shape change here — existing rows just default to version 1.
