import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourseById } from "@/lib/data/instructor";
import { CourseForm } from "@/components/instructor/course-form";
import { ModuleManager } from "@/components/instructor/module-manager";
import { DeleteCourseButton } from "@/components/instructor/delete-course-button";
import { updateCourseAction } from "@/actions/courses-admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
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

  // Admin RLS grants unrestricted SELECT, so this works the same as it
  // does for an instructor viewing their own course -- the function
  // itself has no instructor-only filter, it's purely RLS-scoped.
  const result = await getInstructorCourseById(id);
  if (!result) notFound();
  const { course, modules } = result;

  const boundUpdateAction = updateCourseAction.bind(null, course.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{course.title_en}</h1>
        <Link href="/app/admin/courses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          {isAr ? "كل الدورات" : "All courses"}
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "بيانات الدورة" : "Course details"}</CardTitle>
            <CardDescription>{isAr ? "أي تعديل هنا خاص بالدورة كاملة." : "Changes here apply to the course as a whole."}</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseForm
              action={boundUpdateAction}
              course={course}
              submitLabel={isAr ? "حفظ التعديلات" : "Save changes"}
              cancelHref="/app/admin/courses"
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-medium">{isAr ? "الوحدات والدروس" : "Modules & lessons"}</h2>
          <ModuleManager courseId={course.id} modules={modules} />
        </div>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{isAr ? "منطقة الخطر" : "Danger zone"}</CardTitle>
            <CardDescription>
              {isAr
                ? "حذف الدورة هيشيل الوحدات والدروس والمواد كلها بشكل نهائي."
                : "Deleting a course removes its modules, lessons, and materials permanently."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteCourseButton courseId={course.id} courseTitle={course.title_en} editBase="app/admin" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
