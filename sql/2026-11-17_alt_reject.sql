-- 👎 «Όχι για μένα» στις εναλλακτικές του link (plan.html, 2026-11-17).
-- Run once in the Supabase SQL editor for this project. Safe to re-run.
--
-- Ο πελάτης πατά 👎 σε μια εναλλακτική → εξαφανίζεται, μπαίνει άλλη στη θέση της, και στην επόμενη
-- δημοσίευση δεν ξαναπροτείνεται. ΜΙΑ γραμμή ανά link (όπως το client_shop_log), όλο το αντικείμενο:
--   data = {"<sig>": {"el":"Μπανάνα, Αμύγδαλα", "s":"Ενδιάμεσο", "f":[["Μπανάνα",120],["Αμύγδαλα",20]],
--                     "r":"time"|"taste"|"find"|"", "t":"2026-11-17T10:30:00Z", "x":1?}}
--   sig = τα ελληνικά ονόματα τροφίμων ταξινομημένα, ενωμένα με «|» (ίδιο με mealSignature).
--   x = 1 → ο πελάτης το αναίρεσε (κρατιέται ώστε το hydrate να μην το «ξαναζωντανέψει»).
--
-- Ίδιο μοτίβο με client_workout_log: anon μόνο μέσω των 2 SECURITY DEFINER RPC· ο διαιτολόγος
-- διαβάζει μόνο τα δικά του links (RLS πάνω στο shared_plans.dietitian_id).
-- Χωρίς αυτό το SQL το link δουλεύει κανονικά (κρύβει τοπικά), απλά δεν φτάνει σε σένα.

create table if not exists client_alt_reject (
  token       text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table client_alt_reject enable row level security;
revoke all on table client_alt_reject from anon;
grant select on table client_alt_reject to authenticated;

drop policy if exists "dietitian reads own clients alt rejects" on client_alt_reject;
create policy "dietitian reads own clients alt rejects"
  on client_alt_reject
  for select
  to authenticated
  using (exists (
    select 1 from shared_plans sp
    where sp.token = client_alt_reject.token
      and sp.dietitian_id = auth.uid()
  ));

-- RPC 1 — plan.html, debounced μετά από κάθε 👎 / λόγο / αναίρεση.
create or replace function save_alt_rejects(p_token text, p_data jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return json_build_object('ok', false, 'reason', 'bad_payload');
  end if;
  if length(p_data::text) > 200000 then
    return json_build_object('ok', false, 'reason', 'too_big');
  end if;
  if not exists (select 1 from shared_plans where token = p_token) then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  insert into client_alt_reject (token, data, updated_at)
  values (p_token, p_data, now())
  on conflict (token) do update
    set data = excluded.data, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

-- RPC 2 — plan.html στο boot()/refreshPlan(), για να συγχρονίσει το τοπικό cache (άλλη συσκευή).
create or replace function get_alt_rejects(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce((select data from client_alt_reject where token = p_token), '{}'::jsonb);
$$;

grant execute on function save_alt_rejects(text, jsonb) to anon;
grant execute on function get_alt_rejects(text)          to anon;

notify pgrst, 'reload schema';
