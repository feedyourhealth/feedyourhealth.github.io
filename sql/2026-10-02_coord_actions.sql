-- Συντονισμός (syntonismos.html): οι κινήσεις του διαιτολόγου από το κινητό
-- («Στάλθηκε», «Είδα», «Αναβολή», «Σημαία») σε ΔΙΚΟ ΤΟΥΣ πίνακα, όχι μέσα στο user_data blob.
-- Γιατί: το blob έχει optimistic lock (version). Αν το link έγραφε εκεί, το Dietologist ανοιχτό
-- σε άλλη συσκευή θα έπεφτε σε conflict στο επόμενο save του («Έγιναν αλλαγές σε άλλη συσκευή»).
-- Μία γραμμή ανά (διαιτολόγος, item_key). item_key = '<clientId>|<είδος>|<ref>', π.χ.
-- 'c1712345|note|2026-10-01', 'c1712345|nudge|2026-09-28' (ref = ημ/νία τελευταίου check-in).
-- Τρέξε το μία φορά στο Supabase SQL Editor.

create table if not exists public.coord_actions (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_key   text not null,
  client_id  text not null,
  status     text not null check (status in ('sent','seen','snooze','mute','flag')),
  until      timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.coord_actions enable row level security;

drop policy if exists coord_own_select on public.coord_actions;
drop policy if exists coord_own_insert on public.coord_actions;
drop policy if exists coord_own_update on public.coord_actions;
drop policy if exists coord_own_delete on public.coord_actions;
create policy coord_own_select on public.coord_actions for select using (auth.uid() = user_id);
create policy coord_own_insert on public.coord_actions for insert with check (auth.uid() = user_id);
create policy coord_own_update on public.coord_actions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy coord_own_delete on public.coord_actions for delete using (auth.uid() = user_id);

-- Κανένα δικαίωμα σε ανώνυμους (το link συντονισμού θέλει πάντα login).
revoke all on public.coord_actions from anon;
grant select, insert, update, delete on public.coord_actions to authenticated;
