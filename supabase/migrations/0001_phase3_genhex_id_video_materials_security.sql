-- ============================================================
-- GENHEX — Phase 3 Migration
-- Run this in Supabase SQL Editor (as a single script, or section
-- by section). Written defensively (IF EXISTS / IF NOT EXISTS
-- checks) so it's safe to run even if some pieces are already
-- partially applied. Review before running, especially §4.
-- ============================================================

begin;

-- ============================================================
-- §1. GENHEX ID
-- Format: GEN-STU-000001 / GEN-INS-000001 / GEN-ADM-000001
-- One sequence per role so each role's counter is independent
-- and gaps in one role never skip numbers in another.
-- ============================================================

create sequence if not exists genhex_id_student_seq;
create sequence if not exists genhex_id_instructor_seq;
create sequence if not exists genhex_id_admin_seq;

alter table public.profiles add column if not exists genhex_id text;

create or replace function public.generate_genhex_id(p_role user_role)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
  v_next bigint;
begin
  case p_role
    when 'student' then
      v_prefix := 'GEN-STU-';
      v_next := nextval('genhex_id_student_seq');
    when 'instructor' then
      v_prefix := 'GEN-INS-';
      v_next := nextval('genhex_id_instructor_seq');
    when 'admin' then
      v_prefix := 'GEN-ADM-';
      v_next := nextval('genhex_id_admin_seq');
  end case;
  return v_prefix || lpad(v_next::text, 6, '0');
end;
$$;

revoke all on function public.generate_genhex_id(user_role) from public, anon, authenticated;

-- Assign a GENHEX ID on profile creation, unless one is already set.
create or replace function public.assign_genhex_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.genhex_id is null then
    new.genhex_id := public.generate_genhex_id(new.role);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_genhex_id on public.profiles;
create trigger trg_assign_genhex_id
  before insert on public.profiles
  for each row
  execute function public.assign_genhex_id();

-- Backfill existing profiles that don't have one yet (order by
-- created_at so earlier accounts get lower numbers).
do $$
declare
  r record;
begin
  for r in
    select id, role from public.profiles
    where genhex_id is null
    order by created_at asc
  loop
    update public.profiles
    set genhex_id = public.generate_genhex_id(r.role)
    where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column genhex_id set not null;
create unique index if not exists uq_profiles_genhex_id on public.profiles (genhex_id);

-- ============================================================
-- §2. Lesson video source (YouTube + Google Drive)
-- Existing youtube_video_id column is kept for backward
-- compatibility; video_source picks which field the player reads.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'video_source_type') then
    create type video_source_type as enum ('youtube', 'google_drive');
  end if;
end $$;

alter table public.lessons add column if not exists video_source video_source_type not null default 'youtube';
alter table public.lessons add column if not exists drive_url text;
alter table public.lessons alter column youtube_video_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_lesson_video_source'
  ) then
    alter table public.lessons add constraint chk_lesson_video_source check (
      (video_source = 'youtube' and youtube_video_id is not null)
      or (video_source = 'google_drive' and drive_url is not null)
    );
  end if;
end $$;

-- ============================================================
-- §3. Course materials — link resources to a specific lesson
-- (in addition to the existing course-level linkage). Assumes
-- the `resources` table from the original approved schema
-- already exists; this only adds one nullable column.
-- ============================================================

do $$
begin
  if to_regclass('public.resources') is not null then
    alter table public.resources add column if not exists lesson_id uuid references public.lessons(id) on delete cascade;
    create index if not exists idx_resources_lesson on public.resources (lesson_id);
  else
    raise notice 'public.resources does not exist — create it from the original schema design before Materials will work.';
  end if;
end $$;

-- ============================================================
-- §4. Security hardening — Supabase advisor warnings
--
-- Applies ALTER FUNCTION ... SET search_path to every function
-- matching these names (dynamic, so it works regardless of exact
-- argument signature) — closes function_search_path_mutable.
--
-- Then tightens EXECUTE grants:
--   - Always revoked from `anon` (none of these have a legitimate
--     unauthenticated use case).
--   - attendance_percent stays callable by `authenticated` (students
--     check their own attendance, instructors check enrolled
--     students' attendance).
--   - handle_new_user and rls_auto_enable are revoked from
--     `authenticated` too — these read as trigger-only / internal
--     maintenance functions, not something application code should
--     call directly. REVIEW THIS if either name has a use case in
--     your app I'm not aware of; the safest sign something broke is
--     the sign-up flow specifically (handle_new_user is the trigger
--     behind profile creation) — test sign-up right after running
--     this section.
-- ============================================================

do $$
declare
  r record;
  target_names text[] := array['set_updated_at', 'get_my_role', 'attendance_percent', 'handle_new_user', 'rls_auto_enable'];
begin
  for r in
    select p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(target_names)
  loop
    execute format('alter function public.%I(%s) set search_path = public, pg_temp', r.proname, r.args);
    execute format('revoke execute on function public.%I(%s) from anon', r.proname, r.args);
  end loop;
end $$;

do $$
declare
  r record;
  lockdown_names text[] := array['handle_new_user', 'rls_auto_enable'];
begin
  for r in
    select p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(lockdown_names)
  loop
    execute format('revoke execute on function public.%I(%s) from authenticated', r.proname, r.args);
  end loop;
end $$;

commit;

-- ============================================================
-- §6. Storage — course-materials bucket
--
-- Private bucket (public = false) — materials are only reachable via
-- short-lived signed URLs generated server-side after an authorization
-- check, never a public URL. Path convention the app uses:
--
--   course-materials/<course_id>/<uuid>-<original-filename>
--
-- so storage.foldername(name)[1] is always the course_id, which lets
-- these policies reuse the same is_admin()/is_instructor_of()/
-- is_enrolled_in() helpers the rest of the schema's RLS relies on.
--
-- Assumes those three SECURITY DEFINER helper functions already exist
-- per the originally approved RLS design (§4.2). The DO block below
-- creates minimal fallback versions ONLY if they're missing, so this
-- is safe to run either way — but if they already exist with different
-- logic, this does not touch them (no CREATE OR REPLACE here).
-- ============================================================

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    create function public.is_admin()
    returns boolean
    language sql
    security definer
    set search_path = public, pg_temp
    stable
    as $fn$
      select coalesce((auth.jwt() ->> 'user_role') = 'admin', false);
    $fn$;
  end if;

  if to_regprocedure('public.is_instructor_of(uuid)') is null then
    create function public.is_instructor_of(p_course_id uuid)
    returns boolean
    language sql
    security definer
    set search_path = public, pg_temp
    stable
    as $fn$
      select exists (
        select 1 from public.courses c
        where c.id = p_course_id and c.instructor_id = auth.uid()
      ) or exists (
        select 1 from public.course_instructors ci
        where ci.course_id = p_course_id and ci.instructor_id = auth.uid()
      );
    $fn$;
  end if;

  if to_regprocedure('public.is_enrolled_in(uuid)') is null then
    create function public.is_enrolled_in(p_course_id uuid)
    returns boolean
    language sql
    security definer
    set search_path = public, pg_temp
    stable
    as $fn$
      select exists (
        select 1 from public.enrollments e
        where e.course_id = p_course_id and e.student_id = auth.uid()
      );
    $fn$;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('course-materials', 'course-materials', false)
on conflict (id) do nothing;

drop policy if exists "course_materials_select_authorized" on storage.objects;
create policy "course_materials_select_authorized"
on storage.objects for select
to authenticated
using (
  bucket_id = 'course-materials'
  and (
    public.is_admin()
    or public.is_instructor_of(((storage.foldername(name))[1])::uuid)
    or public.is_enrolled_in(((storage.foldername(name))[1])::uuid)
  )
);

drop policy if exists "course_materials_insert_instructor" on storage.objects;
create policy "course_materials_insert_instructor"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'course-materials'
  and (public.is_admin() or public.is_instructor_of(((storage.foldername(name))[1])::uuid))
);

drop policy if exists "course_materials_delete_instructor" on storage.objects;
create policy "course_materials_delete_instructor"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'course-materials'
  and (public.is_admin() or public.is_instructor_of(((storage.foldername(name))[1])::uuid))
);

-- ============================================================
-- §7. NOT SQL — manual dashboard setting
--
-- auth_leaked_password_protection cannot be set via SQL migration;
-- it's a project-level Auth setting. Enable it at:
--
--   Supabase Dashboard → Authentication → Policies
--   (or Authentication → Settings, depending on dashboard version)
--   → "Leaked password protection" → toggle ON
--
-- This checks new passwords against the HaveIBeenPwned breach
-- database at sign-up/password-change time. No code change needed
-- on the app side — Supabase Auth enforces it server-side.
-- ============================================================
