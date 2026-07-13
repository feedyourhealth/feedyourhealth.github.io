-- Custom recipe authoring (Phase 2b of the Recipes-tab feature set).
-- Run this once in the Supabase SQL editor for this project. Not applied automatically —
-- the app has no DB/infra credentials, this is a manual migration step.

create table custom_recipes (
  id uuid primary key default gen_random_uuid(),
  dietitian_id uuid references auth.users not null,
  name text not null,
  foods jsonb not null default '[]'::jsonb,
  kcal int,
  macro jsonb,
  tags jsonb default '[]'::jsonb,
  instructions text,
  prep_time_min int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table custom_recipes enable row level security;

-- Same scoping convention as the existing shared_plans table: one dietitian's auth.uid()
-- can only see/insert/update/delete their own rows.
create policy "dietitian can manage own custom recipes"
  on custom_recipes
  for all
  using (dietitian_id = auth.uid())
  with check (dietitian_id = auth.uid());

create index custom_recipes_dietitian_id_idx on custom_recipes(dietitian_id);
