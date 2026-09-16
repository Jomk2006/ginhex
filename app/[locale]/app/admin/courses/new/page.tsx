import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/instructor/course-form";
import { createCourseAction } from "@/actions/courses-admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function AdminNewCoursePage({
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{isAr ? "دورة جديدة" : "New course"}</h1>
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "بيانات الدورة" : "Course details"}</CardTitle>
            <CardDescription>
              {isAr ? "تبدأ الدورة كمسودة — انشرها لما تجهّز الوحدات والدروس." : "Starts as a draft — publish it once modules and lessons are ready."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseForm
              action={createCourseAction}
              submitLabel={isAr ? "إنشاء الدورة" : "Create course"}
              cancelHref="/app/admin/courses"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
