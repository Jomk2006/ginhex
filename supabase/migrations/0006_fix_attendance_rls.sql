-- ============================================================
-- GENHEX — Migration 0006: same fix as 0003/0004, extended to
-- attendance_sessions / attendance_records / attendance_import_batches.
--
-- Symptom reported: creating an attendance session, marking
-- attendance, or importing/committing an attendance file from a
-- CSV/XLSX all silently fail to actually save anything for an
-- instructor — same family of issue as courses/modules/lessons
-- before 0003/0004: the base RLS policies on these three tables
-- most likely gate writes on the never-populated JWT claim (or
-- some other check a real instructor doesn't satisfy).
--
-- Additive, same pattern as every migration in this series — OR's
-- in with whatever policy already exists per table/command, can
-- only widen access, never narrows or replaces anything.
-- ============================================================

begin;

-- ---- attendance_sessions (course_id is a direct column) --------
drop policy if exists "genhex_attendance_sessions_write_instructor_or_admin" on public.attendance_sessions;
create policy "genhex_attendance_sessions_write_instructor_or_admin"
on public.attendance_sessions for all
to authenticated
using (public.is_admin() or public.is_instructor_of(course_id))
with check (public.is_admin() or public.is_instructor_of(course_id));

-- ---- attendance_records (reached via attendance_sessions.course_id) --
drop policy if exists "genhex_attendance_records_write_instructor_or_admin" on public.attendance_records;
create policy "genhex_attendance_records_write_instructor_or_admin"
on public.attendance_records for all
to authenticated
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (public.is_admin() or public.is_instructor_of(s.course_id))
  )
)
with check (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (public.is_admin() or public.is_instructor_of(s.course_id))
  )
);

-- ---- attendance_import_batches (course_id is a direct column) --
drop policy if exists "genhex_attendance_import_batches_write_instructor_or_admin" on public.attendance_import_batches;
create policy "genhex_attendance_import_batches_write_instructor_or_admin"
on public.attendance_import_batches for all
to authenticated
using (public.is_admin() or public.is_instructor_of(course_id))
with check (public.is_admin() or public.is_instructor_of(course_id));

commit;
