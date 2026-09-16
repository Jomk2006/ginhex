-- ============================================================
-- GENHEX — Migration 0005: course deletion was entirely
-- unimplemented (no UI button, no server action, and — same as
-- everything else in this series — no guarantee the base schema's
-- RLS on `courses` even grants instructors DELETE on their own
-- courses). This migration adds the DB side; the UI/action side
-- ships in the same change (actions/courses-admin.ts
-- deleteCourseAction, components/instructor/instructor-course-card.tsx).
--
-- Additive, same as 0003/0004 — OR's in with whatever DELETE
-- policy already exists on `courses`, can only widen access.
-- ============================================================

begin;

drop policy if exists "genhex_courses_delete_instructor_or_admin" on public.courses;
create policy "genhex_courses_delete_instructor_or_admin"
on public.courses for delete
to authenticated
using (public.is_admin() or public.is_instructor_of(id));

commit;
