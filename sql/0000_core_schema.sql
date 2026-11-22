-- ════════════════════════════════════════════════════════════════════════════════
-- Βασικό schema του Dietologist — οι πίνακες/RPC που υπήρχαν πριν τον φάκελο sql/
-- Εξαγωγή από το live project στις 2026-11-22 με sql/EXPORT_CORE_SCHEMA.sql.
--
-- Σκοπός: να μπορεί η βάση να ξαναστηθεί από το repo (νέο project, διακοπή τύπου 19/11).
-- Σειρά για άδεια βάση: ΠΡΩΤΑ αυτό το αρχείο, μετά τα υπόλοιπα sql/2026-*.sql κατά ημερομηνία.
-- Οι πίνακες είναι σε σειρά εξαρτήσεων (shared_plans πριν από checkins λόγω foreign key).
--
-- ⚠️ Τα grants παρακάτω είναι τα προεπιλεγμένα του Supabase (όλα τα δικαιώματα σε anon/authenticated).
-- Την πρόσβαση την περιορίζει το RLS (enable row level security + policies). Ο πελάτης (anon) δεν
-- βλέπει/γράφει απευθείας τίποτα — μόνο μέσω των SECURITY DEFINER functions στο τέλος.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── TABLE user_data — ένα jsonb «blob» ανά διαιτολόγο (optimistic lock στη στήλη version)
create table if not exists public.user_data (
  user_id uuid not null,
  data jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default now() not null,
  version integer default 1 not null,
  constraint user_data_pkey primary key (user_id),
  constraint user_data_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);
alter table public.user_data enable row level security;

-- ── TABLE shared_plans — snapshot πλάνου/στόχων που διαβάζει ο σύνδεσμος πελάτη
create table if not exists public.shared_plans (
  token text not null,
  dietitian_id uuid,
  snapshot jsonb not null,
  client_name text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  constraint shared_plans_pkey primary key (token),
  constraint shared_plans_dietitian_id_fkey foreign key (dietitian_id) references auth.users(id) on delete cascade
);
alter table public.shared_plans enable row level security;

-- ── TABLE checkins — ημερήσια σύνοψη τήρησης από τον σύνδεσμο
create table if not exists public.checkins (
  token text not null,
  date date not null,
  meals_done integer default 0 not null,
  meals_total integer default 0 not null,
  water_glasses integer default 0 not null,
  water_goal integer default 0 not null,
  supps_done integer default 0 not null,
  supps_total integer default 0 not null,
  updated_at timestamp with time zone default now() not null,
  constraint checkins_pkey primary key (token, date),
  constraint checkins_token_fkey foreign key (token) references shared_plans(token) on delete cascade
);
alter table public.checkins enable row level security;

-- ── TABLE client_logs — βάρος + μήνυμα πελάτη ανά ημέρα (note μπορεί να ξεκινά με [tag:…])
create table if not exists public.client_logs (
  token text not null,
  date date not null,
  weight_kg numeric,
  note text,
  created_at timestamp with time zone default now() not null,
  constraint client_logs_pkey primary key (token, date)
);
alter table public.client_logs enable row level security;

-- ── TABLE plan_feedback — εβδομαδιαία αξιολόγηση πλάνου
create table if not exists public.plan_feedback (
  token text not null,
  week_start date not null,
  breakfast smallint,
  snacks smallint,
  lunch smallint,
  dinner smallint,
  recipes_ease smallint,
  ingredients_ease smallint,
  training_energy smallint,
  continue_likelihood smallint,
  low_rating_reasons jsonb,
  created_at timestamp with time zone default now() not null,
  constraint plan_feedback_pkey primary key (token, week_start)
);
alter table public.plan_feedback enable row level security;

-- ── POLICIES (RLS)
create policy own_select on public.user_data as permissive for select to public using ((auth.uid() = user_id));
create policy own_insert on public.user_data as permissive for insert to public with check ((auth.uid() = user_id));
create policy own_update on public.user_data as permissive for update to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));

create policy owner_select on public.shared_plans as permissive for select to public using ((auth.uid() = dietitian_id));
create policy "owner insert" on public.shared_plans as permissive for insert to public with check ((auth.uid() = dietitian_id));
create policy "owner update" on public.shared_plans as permissive for update to public using ((auth.uid() = dietitian_id));
create policy "owner delete" on public.shared_plans as permissive for delete to public using ((auth.uid() = dietitian_id));

create policy "owner select checkins" on public.checkins as permissive for select to authenticated
  using ((exists (select 1 from shared_plans sp where ((sp.token = checkins.token) and (sp.dietitian_id = auth.uid())))));
create policy owner_select on public.client_logs as permissive for select to authenticated
  using ((exists (select 1 from shared_plans sp where ((sp.token = client_logs.token) and (sp.dietitian_id = auth.uid())))));
create policy owner_select on public.plan_feedback as permissive for select to public
  using ((exists (select 1 from shared_plans sp where ((sp.token = plan_feedback.token) and (sp.dietitian_id = auth.uid())))));

-- ── GRANTS (προεπιλογή Supabase — ο περιορισμός γίνεται από το RLS)
grant select, insert, update, delete, truncate, references, trigger on public.user_data to anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.shared_plans to anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.checkins to anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.client_logs to anon, authenticated;
grant select, insert, update, delete, truncate, references, trigger on public.plan_feedback to anon, authenticated;

-- ── RPC: ο σύνδεσμος πελάτη (anon) διαβάζει/γράφει ΜΟΝΟ μέσω αυτών
create or replace function public.get_shared_plan(p_token text)
 returns table(snapshot jsonb, client_name text, updated_at timestamp with time zone, expires_at timestamp with time zone)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select snapshot, client_name, updated_at, expires_at
  from shared_plans
  where token = p_token and (expires_at is null or expires_at > now())
  limit 1;
$function$;
grant execute on function public.get_shared_plan(p_token text) to anon, authenticated;

create or replace function public.submit_checkin(p_token text, p_date date, p_meals_done integer, p_meals_total integer, p_water_glasses integer, p_water_goal integer, p_supps_done integer, p_supps_total integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into checkins(token, date, meals_done, meals_total, water_glasses, water_goal, supps_done, supps_total, updated_at)
  values (p_token, p_date, p_meals_done, p_meals_total, p_water_glasses, p_water_goal, p_supps_done, p_supps_total, now())
  on conflict (token, date) do update set
    meals_done = excluded.meals_done, meals_total = excluded.meals_total,
    water_glasses = excluded.water_glasses, water_goal = excluded.water_goal,
    supps_done = excluded.supps_done, supps_total = excluded.supps_total,
    updated_at = excluded.updated_at;
end;
$function$;
grant execute on function public.submit_checkin(p_token text, p_date date, p_meals_done integer, p_meals_total integer, p_water_glasses integer, p_water_goal integer, p_supps_done integer, p_supps_total integer) to anon, authenticated;

create or replace function public.submit_client_log(p_token text, p_date date, p_weight_kg numeric default null::numeric, p_note text default null::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not exists (select 1 from public.shared_plans where token = p_token) then
    raise exception 'invalid token';
  end if;

  insert into public.client_logs (token, date, weight_kg, note)
  values (p_token, p_date, p_weight_kg, p_note)
  on conflict (token, date) do update
    set weight_kg = excluded.weight_kg,
        note = excluded.note;
end;
$function$;
grant execute on function public.submit_client_log(p_token text, p_date date, p_weight_kg numeric, p_note text) to anon, authenticated;

create or replace function public.submit_plan_feedback(p_token text, p_week_start date, p_breakfast smallint, p_snacks smallint, p_lunch smallint, p_dinner smallint, p_recipes_ease smallint, p_ingredients_ease smallint, p_training_energy smallint, p_continue_likelihood smallint, p_low_rating_reasons jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not exists (select 1 from public.shared_plans where token = p_token) then
    raise exception 'invalid token';
  end if;

  insert into public.plan_feedback (
    token, week_start, breakfast, snacks, lunch, dinner,
    recipes_ease, ingredients_ease, training_energy,
    continue_likelihood, low_rating_reasons
  ) values (
    p_token, p_week_start, p_breakfast, p_snacks, p_lunch, p_dinner,
    p_recipes_ease, p_ingredients_ease, p_training_energy,
    p_continue_likelihood, p_low_rating_reasons
  )
  on conflict (token, week_start) do update set
    breakfast = excluded.breakfast, snacks = excluded.snacks,
    lunch = excluded.lunch, dinner = excluded.dinner,
    recipes_ease = excluded.recipes_ease, ingredients_ease = excluded.ingredients_ease,
    training_energy = excluded.training_energy,
    continue_likelihood = excluded.continue_likelihood,
    low_rating_reasons = excluded.low_rating_reasons,
    created_at = now();
end;
$function$;
grant execute on function public.submit_plan_feedback(p_token text, p_week_start date, p_breakfast smallint, p_snacks smallint, p_lunch smallint, p_dinner smallint, p_recipes_ease smallint, p_ingredients_ease smallint, p_training_energy smallint, p_continue_likelihood smallint, p_low_rating_reasons jsonb) to anon, authenticated;
