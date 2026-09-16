"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface EnrollActionState {
  error?: string;
  success?: boolean;
}

const initialErrorState = { error: "generic" } as const;

/**
 * Open-enrollment self-enroll. Only works when the course's
 * enrollment_mode is 'open' — the `validate_application_enrollment`
 * trigger on `enrollments` rejects the insert otherwise, so this is
 * enforced at the database layer, not just by the UI hiding the button.
 */
export async function enrollOpenAction(
  courseId: string,
  courseSlug: string,
  locale: string
): Promise<EnrollActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "signInRequired" };
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    return { error: "alreadyEnrolled" };
  }

  const { error } = await supabase.from("enrollments").insert({
    student_id: user.id,
    course_id: courseId,
  });

  if (error) {
    // Unique-violation race (double-click, two tabs) reads as "already enrolled".
    if (error.code === "23505") {
      return { error: "alreadyEnrolled" };
    }
    console.error("enrollOpenAction: enrollments insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return initialErrorState;
  }

  revalidatePath(`/${locale}/courses/${courseSlug}`);
  revalidatePath(`/${locale}/app/student`);
  return { success: true };
}
