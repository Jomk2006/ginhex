-- ============================================================
-- GENHEX — Migration 0003: fix role checks that depended on a
-- JWT custom claim which was never actually populated.
--
-- Background: is_admin() (added in migration 0001) reads
-- auth.jwt() ->> 'user_role'. That claim only exists if a
-- Supabase "Customize Access Token" Auth Hook is configured in
-- the project dashboard to inject it from profiles.role on every
-- token issue/refresh. No such hook exists in this project (there
-- is no SQL function for it anywhere, and none is wired up in
-- Authentication → Hooks), so the claim has always been absent,
-- and is_admin() has always returned false — even for real admins.
--
-- Concretely this broke:
--   - Any RLS policy that calls is_admin() (e.g. the
--     course-materials storage policies in migration 0001 §6).
--   - Course creation: instructors/admins creating a row in
--     `courses` were being rejected by whichever RLS policy on
--     that table guards INSERT, if it checks the same claim.
--   - App-side role-based redirects after sign-in (fixed
--     separately, in application code — see actions/auth.ts,
--     app/auth/callback/route.ts, lib/supabase/middleware.ts —
--     which now read profiles.role directly instead of decoding
--     the JWT).
--
-- Fix: redefine is_admin() to check profiles.role instead, same
-- pattern already used by is_instructor_or_admin() in migration
-- 0002 — no dashboard configuration required, and one less moving
-- part to keep in sync.
-- ============================================================

begin;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Additive INSERT policy for courses: instructors and admins may
-- create a course they're listed as the instructor of. This does
-- NOT drop or replace whatever INSERT policy already exists on
-- `courses` — Postgres OR's together every RLS policy of the same
-- command type, so this can only widen who's allowed to insert,
-- never narrow access or break an existing policy this migration
-- doesn't know the exact definition of (the base schema/policies
-- predate this migrations folder and aren't included in it).
--
-- If course creation still fails with a 42501 / "row-level
-- security policy" error after this migration, the base INSERT
-- policy on `courses` is checking something else entirely (e.g. a
-- hard-coded role list, or a column this schema doesn't have) —
-- open Supabase → Table Editor → courses → RLS policies and
-- compare against this one.
drop policy if exists "genhex_courses_insert_instructor_or_admin" on public.courses;
create policy "genhex_courses_insert_instructor_or_admin"
on public.courses for insert
to authenticated
with check (
  instructor_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('instructor', 'admin')
  )
);

commit;

-- ============================================================
-- NOT SQL — the Auth Hook is no longer required by this app, but
-- if you'd still rather route the JWT-claim way for other reasons
-- (edge middleware that can't hit the DB, a third-party consumer
-- of the token, etc.), it's still available as an option:
--
--   Supabase Dashboard → Authentication → Hooks → Customize Access
--   Token (Claims) Hook → point it at a function that sets
--   event.claims.user_role from profiles.role. Not needed for
--   anything in this codebase as of this migration.
-- ============================================================
