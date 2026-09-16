import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCoursesAdmin } from "@/lib/data/admin";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function AdminAttendanceCoursesPage({
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
  if (!profile || profile.role !== "admin") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const courses = await getAllCoursesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{isAr ? "الحضور" : "Attendance"}</h1>
      <p className="text-muted-foreground">
        {isAr ? "اختر دورة لإدارة جلسات الحضور الخاصة بها." : "Choose a course to manage its attendance sessions."}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={`/app/admin/attendance/${course.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{course.title_en}</CardTitle>
                <CardDescription>{course.title_ar}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
