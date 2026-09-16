import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentEnrollments } from "@/lib/data/enrollments";
import { StudentAttendanceCard } from "@/components/attendance/student-attendance-card";

export default async function StudentAttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "student") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const enrollments = await getStudentEnrollments(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{isAr ? "الحضور" : "Attendance"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "نسبة حضورك في كل دورة مسجَّل بها." : "Your attendance percentage in each course you're enrolled in."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map(({ enrollment }) => {
          const course = (enrollment as unknown as { courses: { id: string; title_en: string; title_ar: string } }).courses;
          return (
            <StudentAttendanceCard
              key={enrollment.id}
              studentId={user.id}
              courseId={course.id}
              courseTitleEn={course.title_en}
              courseTitleAr={course.title_ar}
            />
          );
        })}
      </div>
    </div>
  );
}
