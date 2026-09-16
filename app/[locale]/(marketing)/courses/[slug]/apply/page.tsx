import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCourseBySlug } from "@/lib/data/courses";
import { getFormById, getExistingSubmission } from "@/lib/data/forms";
import { createClient } from "@/lib/supabase/server";
import { ApplicationForm } from "@/components/courses/application-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { FormFieldSchema } from "@/types/domain";

export default async function CourseApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const result = await getCourseBySlug(slug);
  if (!result) notFound();
  const { course } = result;

  if (course.enrollment_mode !== "application" || !course.application_form_id) {
    notFound();
  }

  const form = await getFormById(course.application_form_id);
  if (!form) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const existingSubmission = user ? await getExistingSubmission(form.id, user.id) : null;
  const fieldSchema = (form.field_schema as unknown as FormFieldSchema[]) ?? [];

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? form.title_ar : form.title_en}</CardTitle>
          {(form.description_en || form.description_ar) && (
            <CardDescription>{isAr ? form.description_ar : form.description_en}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {existingSubmission ? (
            <Alert>
              {isAr
                ? `لديك طلب مُرسَل بالفعل (الحالة: ${existingSubmission.status}).`
                : `You already have a submitted application (status: ${existingSubmission.status}).`}
            </Alert>
          ) : (
            <ApplicationForm
              formId={form.id}
              fieldSchema={fieldSchema}
              requiresAccount={form.requires_account}
              isSignedIn={!!user}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
