-- ============================================================
-- GENHEX — Migration 0004: same fix as 0003, extended to
-- modules / lessons / resources.
--
-- Symptom reported: creating a course started working after 0003,
-- but adding a module, a lesson (with a YouTube/Drive video link),
-- or a material on that course silently does nothing — no error
-- shown, nothing added, page just sits there.
--
-- That silence is itself two separate problems, both fixed here
-- and in the application code alongside this migration:
--
-- 1. Same root cause as the courses INSERT problem (see 0003):
--    the base RLS policies on modules/lessons/resources (defined
--    before this migrations folder starts, so not visible here)
--    most likely gate writes on the same never-populated JWT
--    claim, or on some other check that doesn't hold for a real
--    instructor/admin. Fixed the same way as 0003 — an ADDITIVE
--    policy per table/command that can only widen access, built
--    on is_admin() (now profiles-based, see 0003) and
--    is_instructor_of() (already profiles/course-based, from
--    migration 0001 — unaffected by the JWT bug, but only usable
--    here once we can also reach it from lessons/resources via a
--    join back to the owning course).
--
-- 2. A real code bug, independent of RLS: createModuleAction /
--    createLessonAction / deleteModuleAction / deleteLessonAction
--    / moveModuleAction / moveLessonAction (actions/courses-admin.ts)
--    never returned or logged anything on failure — an RLS
--    rejection there was indistinguishable from success, which is
--    why nothing appeared to happen. Fixed in the same change that
--    ships this migration (actions/courses-admin.ts now logs and
--    returns an error state; the Add module / Add lesson forms now
--    show it).
-- ============================================================

begin;

-- ---- modules -------------------------------------------------
drop policy if exists "genhex_modules_write_instructor_or_admin" on public.modules;
create policy "genhex_modules_write_instructor_or_admin"
on public.modules for all
to authenticated
using (public.is_admin() or public.is_instructor_of(course_id))
with check (public.is_admin() or public.is_instructor_of(course_id));

-- ---- lessons (reached via modules.course_id) ------------------
drop policy if exists "genhex_lessons_write_instructor_or_admin" on public.lessons;
create policy "genhex_lessons_write_instructor_or_admin"
on public.lessons for all
to authenticated
using (
  exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (public.is_admin() or public.is_instructor_of(m.course_id))
  )
)
with check (
  exists (
    select 1 from public.modules m
    where m.id = lessons.module_id
      and (public.is_admin() or public.is_instructor_of(m.course_id))
  )
);

-- ---- resources (course_id is already a direct column) ---------
drop policy if exists "genhex_resources_write_instructor_or_admin" on public.resources;
create policy "genhex_resources_write_instructor_or_admin"
on public.resources for all
to authenticated
using (
  course_id is not null and (public.is_admin() or public.is_instructor_of(course_id))
)
with check (
  course_id is not null and (public.is_admin() or public.is_instructor_of(course_id))
);

commit;

-- ============================================================
-- These are "for all" (SELECT/INSERT/UPDATE/DELETE) rather than
-- just "for insert" like 0003's courses policy, since the same
-- silent-failure symptom applies to deleting/reordering modules
-- and lessons too, and RLS has no separate reordering verb.
--
-- Additive, like 0003: these OR in with whatever policies already
-- exist on these tables (same command, same table => combined with
-- OR), so this can only grant access, never revoke an existing
-- policy's grant. If something that used to work stops working
-- after this migration, it wasn't this migration.
-- ============================================================
