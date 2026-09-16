import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses } from "@/lib/data/instructor";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { deleteError } = await searchParams;
  const locale = await getLocale();
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "instructor") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const courses = await getInstructorCourses(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isAr ? "دوراتك" : "Your courses"}</h1>
        <Button asChild size="sm">
          <Link href="/app/instructor/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
        </Button>
      </div>

      {deleteError && (
        <Alert variant="destructive">
          {isAr
            ? "تعذّر حذف الدورة — راجع الـ server logs لمعرفة السبب بالتفصيل."
            : "Couldn't delete that course — check the server logs for the exact error."}
        </Alert>
      )}

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
