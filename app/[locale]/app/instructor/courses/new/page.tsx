import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/instructor/course-form";
import { createCourseAction } from "@/actions/courses-admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function NewCoursePage() {
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

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>New course</CardTitle>
          <CardDescription>Starts as a draft — publish it once modules and lessons are ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm action={createCourseAction} submitLabel="Create course" cancelHref="/app/instructor/courses" />
        </CardContent>
      </Card>
    </div>
  );
}
