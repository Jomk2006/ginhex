-- ============================================================
-- GENHEX — Migration 0002: course-thumbnails Storage bucket
--
-- Public bucket (unlike course-materials) -- thumbnails are meant to
-- be visible in the public course catalog without a signed URL, so
-- there's no enrollment gate to enforce for reads. Uploads are scoped
-- by the uploader's own user id (path: <user_id>/<uuid>.<ext>), not by
-- course_id, because the admin/instructor course-creation form uploads
-- the image BEFORE the course row exists -- there's no course_id yet
-- to scope an is_instructor_of() check against.
--
-- Run in Supabase SQL Editor.
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.is_instructor_or_admin()') is null then
    create function public.is_instructor_or_admin()
    returns boolean
    language sql
    security definer
    set search_path = public, pg_temp
    stable
    as $fn$
      select exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('instructor', 'admin')
      );
    $fn$;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "course_thumbnails_insert" on storage.objects;
create policy "course_thumbnails_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'course-thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_instructor_or_admin()
);

drop policy if exists "course_thumbnails_update" on storage.objects;
create policy "course_thumbnails_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'course-thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "course_thumbnails_delete" on storage.objects;
create policy "course_thumbnails_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'course-thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
