import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseSessions } from "@/lib/data/attendance";
import { SessionList } from "@/components/attendance/session-list";

export default async function AdminCourseAttendancePage({
  params,
}: {
  params: Promise<{ courseId: string; locale: string }>;
}) {
  const { courseId, locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const { data: course } = await supabase.from("courses").select("title_en, title_ar").eq("id", courseId).maybeSingle();
  if (!course) notFound();

  const sessions = await getCourseSessions(courseId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{course.title_en}</h1>
      <SessionList courseId={courseId} sessions={sessions} attendanceBasePath="/app/admin/attendance" />
    </div>
  );
}
