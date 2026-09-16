import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses, getInstructorStudentCount } from "@/lib/data/instructor";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function InstructorDashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "instructor") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";
  const name = isAr ? profile?.full_name_ar : profile?.full_name_en;

  const courses = await getInstructorCourses(user.id);
  const published = courses.filter((c) => c.status === "published").length;
  const draft = courses.filter((c) => c.status === "draft").length;
  const studentCount = await getInstructorStudentCount(user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("welcome", { name: name ?? user.email ?? "" })}</h1>
        <p className="text-muted-foreground">{t("instructorOverview")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{isAr ? "إجمالي الدورات" : "Total courses"}</CardDescription>
            <CardTitle className="text-3xl">{courses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{isAr ? "منشورة" : "Published"}</CardDescription>
            <CardTitle className="text-3xl">{published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{isAr ? "مسودة" : "Draft"}</CardDescription>
            <CardTitle className="text-3xl">{draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{isAr ? "عدد الطلاب" : "Students"}</CardDescription>
            <CardTitle className="text-3xl">{studentCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{isAr ? "دوراتك" : "Your courses"}</h2>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/app/instructor/attendance">{isAr ? "الحضور" : "Attendance"}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/instructor/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
          </Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لم تُنشئ أي دورة بعد" : "You haven't created a course yet"}</CardTitle>
            <CardDescription>
              {isAr ? "ابدأ ببناء أول دورة لك على GENHEX." : "Start building your first course on GENHEX."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <InstructorCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
