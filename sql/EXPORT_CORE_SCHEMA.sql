-- ════════════════════════════════════════════════════════════════════════════════
-- ΕΞΑΓΩΓΗ ΒΑΣΙΚΟΥ SCHEMA (μόνο ανάγνωση — δεν αλλάζει τίποτα στη βάση)
-- 2026-11-22
--
-- Γιατί: οι βασικοί πίνακες (user_data, shared_plans, checkins, client_logs, plan_feedback)
-- και τα RPC τους (get_shared_plan, submit_checkin, submit_client_log, submit_plan_feedback)
-- φτιάχτηκαν πριν τον φάκελο sql/ — δεν υπάρχουν στο repo, άρα η βάση δεν μπορεί να ξαναστηθεί
-- από εδώ αν χρειαστεί (νέο project, διακοπή τύπου 19/11).
--
-- Πώς:
--   1. Supabase → SQL Editor → New query → επικόλλησε ΟΛΟ αυτό το αρχείο → Run.
--   2. Βγαίνει ΜΙΑ γραμμή, στήλη "schema_sql". Αντέγραψε το περιεχόμενό της.
--   3. Αποθήκευσέ το ως sql/0000_core_schema.sql (ή δώσ' το στον Claude να το κάνει).
-- Δεν περιέχει δεδομένα πελατών — μόνο ορισμούς πινάκων, ευρετήρια, κανόνες RLS, functions.
-- ════════════════════════════════════════════════════════════════════════════════
with tbls as (
  select unnest(array['user_data','shared_plans','checkins','client_logs','plan_feedback']) as tbl
),
fns as (
  select unnest(array['get_shared_plan','submit_checkin','submit_client_log','submit_plan_feedback']) as fn
),
table_ddl as (
  select 1 as ord, c.relname::text as k,
    '-- ── TABLE ' || c.relname || E'\ncreate table if not exists public.' || c.relname || E' (\n  '
    || string_agg(
         quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
         || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
         || case when a.attnotnull then ' not null' else '' end,
         E',\n  ' order by a.attnum)
    || coalesce((select E',\n  ' || string_agg('constraint ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid), E',\n  ')
                 from pg_constraint con where con.conrelid = c.oid), '')
    || E'\n);\n'
    || case when c.relrowsecurity then 'alter table public.' || c.relname || E' enable row level security;\n' else '' end
    as sql
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  join tbls on tbls.tbl = c.relname::text
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  group by c.oid, c.relname, c.relrowsecurity
),
index_ddl as (
  select 2 as ord, i.tablename::text as k, (i.indexdef || ';')::text as sql
  from pg_indexes i join tbls on tbls.tbl = i.tablename::text
  where i.schemaname = 'public'
    and i.indexname not in (select conname from pg_constraint)   -- PK/unique ήδη στο create table
),
policy_ddl as (
  select 3 as ord, p.tablename::text as k,
    format('create policy %I on public.%I as %s for %s to %s%s%s;',
      p.policyname, p.tablename, p.permissive, p.cmd, array_to_string(p.roles, ', '),
      coalesce(' using (' || p.qual || ')', ''), coalesce(' with check (' || p.with_check || ')', '')) as sql
  from pg_policies p join tbls on tbls.tbl = p.tablename::text
  where p.schemaname = 'public'
),
grant_ddl as (
  select 4 as ord, g.table_name::text as k,
    format('grant %s on public.%I to %I;', string_agg(g.privilege_type::text, ', '), g.table_name::text, g.grantee::text) as sql
  from information_schema.role_table_grants g join tbls on tbls.tbl = g.table_name::text
  where g.table_schema::text = 'public' and g.grantee::text in ('anon', 'authenticated')
  group by g.table_name::text, g.grantee::text
),
fn_ddl as (
  select 5 as ord, p.proname::text as k,
    pg_get_functiondef(p.oid) || E';\n'
    || coalesce((select string_agg(format('grant execute on function public.%I(%s) to %I;', p.proname, pg_get_function_identity_arguments(p.oid), r.rolname), E'\n')
                 from pg_roles r where r.rolname in ('anon', 'authenticated') and has_function_privilege(r.oid, p.oid, 'execute')), '')
    as sql
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
  join fns on fns.fn = p.proname::text
)
select
  E'-- Βασικό schema του Dietologist (εξαγωγή ' || to_char(now(), 'YYYY-MM-DD') || E', από sql/EXPORT_CORE_SCHEMA.sql)\n'
  || E'-- Πίνακες: user_data, shared_plans, checkins, client_logs, plan_feedback · RPC: get_shared_plan, submit_*\n\n'
  || string_agg(sql, E'\n' order by ord, k) as schema_sql
from (
  select * from table_ddl
  union all select * from index_ddl
  union all select * from policy_ddl
  union all select * from grant_ddl
  union all select * from fn_ddl
) all_ddl;
