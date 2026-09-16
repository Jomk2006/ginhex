import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentEnrollments } from "@/lib/data/enrollments";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function StudentDashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "student") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";
  const name = isAr ? profile?.full_name_ar : profile?.full_name_en;

  const enrollments = await getStudentEnrollments(user.id);
  const inProgress = enrollments.filter((e) => e.progressPercent < 100);
  const completed = enrollments.filter((e) => e.progressPercent >= 100);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("welcome", { name: name ?? user.email ?? "" })}</h1>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/student/attendance">{isAr ? "الحضور" : "Attendance"}</Link>
          </Button>
        </div>
        <p className="text-muted-foreground">{t("studentOverview")}</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لست مسجَّلاً في أي دورة بعد" : "You're not enrolled in any course yet"}</CardTitle>
            <CardDescription>
              {isAr ? "استكشف الدورات المتاحة وابدأ التعلّم." : "Explore available courses and start learning."}
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button asChild>
              <Link href="/courses">{isAr ? "استعرض الدورات" : "Browse courses"}</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">{isAr ? "متابعة التعلّم" : "Continue learning"}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map(({ enrollment, progressPercent, completedLessons, totalLessons }) => {
                  const course = (enrollment as unknown as { courses: { slug: string; title_en: string; title_ar: string } }).courses;
                  return (
                    <EnrolledCourseCard
                      key={enrollment.id}
                      courseSlug={course.slug}
                      titleEn={course.title_en}
                      titleAr={course.title_ar}
                      progressPercent={progressPercent}
                      completedLessons={completedLessons}
                      totalLessons={totalLessons}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">{isAr ? "الدورات المكتملة" : "Completed courses"}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map(({ enrollment, progressPercent, completedLessons, totalLessons }) => {
                  const course = (enrollment as unknown as { courses: { slug: string; title_en: string; title_ar: string } }).courses;
                  return (
                    <EnrolledCourseCard
                      key={enrollment.id}
                      courseSlug={course.slug}
                      titleEn={course.title_en}
                      titleAr={course.title_ar}
                      progressPercent={progressPercent}
                      completedLessons={completedLessons}
                      totalLessons={totalLessons}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
