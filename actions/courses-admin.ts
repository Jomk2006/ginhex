"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { courseSchema, moduleSchema, lessonSchema } from "@/lib/validation/courses";

export interface FormActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function readCourseFields(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    title_en: String(formData.get("title_en") ?? ""),
    title_ar: String(formData.get("title_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    description_ar: String(formData.get("description_ar") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
    category: String(formData.get("category") ?? ""),
    level: (formData.get("level") || undefined) as "beginner" | "intermediate" | "advanced" | undefined,
    status: String(formData.get("status") ?? "draft") as "draft" | "published" | "archived",
    enrollment_mode: String(formData.get("enrollment_mode") ?? "open") as "open" | "application",
    application_form_id: String(formData.get("application_form_id") ?? ""),
    exam_requirement: String(formData.get("exam_requirement") ?? "none") as "required" | "optional" | "none",
  };
}

export async function createCourseAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = courseSchema.safeParse(readCourseFields(formData));
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      slug: parsed.data.slug,
      title_en: parsed.data.title_en,
      title_ar: parsed.data.title_ar,
      description_en: parsed.data.description_en || null,
      description_ar: parsed.data.description_ar || null,
      cover_image_url: parsed.data.cover_image_url || null,
      category: parsed.data.category || null,
      level: parsed.data.level ?? null,
      status: parsed.data.status,
      enrollment_mode: parsed.data.enrollment_mode,
      application_form_id: parsed.data.application_form_id || null,
      exam_requirement: parsed.data.exam_requirement,
      instructor_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    // Logged server-side (Vercel function logs), not shown to the user —
    // "generic" on screen stays generic, but this line is what turns a
    // guess into a fact next time something fails here.
    console.error("createCourseAction: courses insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: error.code === "23505" ? "slugTaken" : "generic" };
  }

  // Explicitly record the creator as an instructor-of-record for this
  // course. courses.instructor_id already marks ownership, but RLS's
  // is_instructor_of() may check course_instructors instead of (or in
  // addition to) that column depending on how it was implemented live —
  // this insert makes the creator recognized either way, so the
  // immediate SELECT-back above (and every future admin/instructor page
  // load for this course) can't fail an RLS check that only looks at
  // the join table. Failure here is logged but not fatal to course
  // creation — the course row itself already exists and is usable.
  const { error: coInstructorError } = await supabase
    .from("course_instructors")
    .insert({ course_id: course.id, instructor_id: user.id, is_primary: true });
  if (coInstructorError) {
    console.error("createCourseAction: course_instructors insert failed", {
      code: coInstructorError.code,
      message: coInstructorError.message,
    });
  }

  // Redirect to the creator's own role-scoped edit page — an admin who
  // creates a course must land on /app/admin/..., not /app/instructor/...,
  // since that route immediately bounces non-instructors back to their
  // own dashboard.
  const { data: creatorProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const editBase = creatorProfile?.role === "admin" ? "app/admin" : "app/instructor";

  revalidatePath(`/${locale}/${editBase}`);
  redirect(`/${locale}/${editBase}/courses/${course.id}/edit`);
}

export async function updateCourseAction(
  courseId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = courseSchema.safeParse(readCourseFields(formData));
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      slug: parsed.data.slug,
      title_en: parsed.data.title_en,
      title_ar: parsed.data.title_ar,
      description_en: parsed.data.description_en || null,
      description_ar: parsed.data.description_ar || null,
      cover_image_url: parsed.data.cover_image_url || null,
      category: parsed.data.category || null,
      level: parsed.data.level ?? null,
      status: parsed.data.status,
      enrollment_mode: parsed.data.enrollment_mode,
      application_form_id: parsed.data.application_form_id || null,
      exam_requirement: parsed.data.exam_requirement,
    })
    .eq("id", courseId);

  if (error) {
    console.error("updateCourseAction: courses update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: error.code === "23505" ? "slugTaken" : "generic" };
  }

  revalidatePath("/[locale]/app", "layout");
  return {};
}

/**
 * Deletes a course (and, via FK cascade, its modules/lessons/resources/
 * enrollments — this is a genuinely destructive action, so the UI calling
 * this always confirms with the instructor/admin first). Redirects back
 * to the courses list on success rather than returning state, since the
 * course this page was showing no longer exists to render.
 */
export async function deleteCourseAction(
  courseId: string,
  editBase: "app/instructor" | "app/admin",
  locale: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    console.error("deleteCourseAction: courses delete failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    // No FormActionState channel here (this is a plain <form action>, not
    // wired to useActionState) — redirecting back with a query flag is the
    // simplest way to surface the failure without a bigger refactor.
    redirect(`/${locale}/${editBase}/courses?deleteError=1`);
  }

  revalidatePath("/[locale]/app", "layout");
  redirect(`/${locale}/${editBase}/courses`);
}

export async function createModuleAction(
  courseId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = moduleSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    order_index: formData.get("order_index"),
  });
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("modules").insert({ course_id: courseId, ...parsed.data });
  if (error) {
    console.error("createModuleAction: modules insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }
  revalidatePath("/[locale]/app", "layout");
  return {};
}

export async function deleteModuleAction(moduleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) {
    console.error("deleteModuleAction: modules delete failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
  revalidatePath("/[locale]/app", "layout");
}

export async function createLessonAction(
  moduleId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = lessonSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    video_source: formData.get("video_source") || "youtube",
    youtube_video_id: formData.get("youtube_video_id"),
    drive_url: formData.get("drive_url"),
    duration_seconds: formData.get("duration_seconds"),
    order_index: formData.get("order_index"),
    is_preview: formData.get("is_preview") === "on",
  });
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title_en: parsed.data.title_en,
    title_ar: parsed.data.title_ar,
    video_source: parsed.data.video_source,
    youtube_video_id: parsed.data.youtube_video_id || null,
    drive_url: parsed.data.drive_url || null,
    duration_seconds: parsed.data.duration_seconds,
    order_index: parsed.data.order_index,
    is_preview: parsed.data.is_preview,
  });
  if (error) {
    console.error("createLessonAction: lessons insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }
  revalidatePath("/[locale]/app", "layout");
  return {};
}

export async function deleteLessonAction(lessonId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) {
    console.error("deleteLessonAction: lessons delete failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
  revalidatePath("/[locale]/app", "layout");
}

/**
 * Swaps order_index with the sibling immediately before/after. Both
 * rows are read fresh and written in sequence rather than trusting
 * client-supplied indices, so a stale UI can't corrupt ordering.
 */
export async function moveModuleAction(moduleId: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: current } = await supabase.from("modules").select("*").eq("id", moduleId).maybeSingle();
  if (!current) return;

  const { data: siblings } = await supabase
    .from("modules")
    .select("id, order_index")
    .eq("course_id", current.course_id)
    .order("order_index", { ascending: true });
  if (!siblings) return;

  const index = siblings.findIndex((s) => s.id === moduleId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const target = siblings[swapIndex];
  const { error: e1 } = await supabase.from("modules").update({ order_index: target.order_index }).eq("id", moduleId);
  const { error: e2 } = await supabase.from("modules").update({ order_index: current.order_index }).eq("id", target.id);
  if (e1 || e2) {
    console.error("moveModuleAction: modules update failed", { e1: e1?.message, e2: e2?.message });
  }
  revalidatePath("/[locale]/app", "layout");
}

export async function moveLessonAction(lessonId: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: current } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
  if (!current) return;

  const { data: siblings } = await supabase
    .from("lessons")
    .select("id, order_index")
    .eq("module_id", current.module_id)
    .order("order_index", { ascending: true });
  if (!siblings) return;

  const index = siblings.findIndex((s) => s.id === lessonId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const target = siblings[swapIndex];
  const { error: e1 } = await supabase.from("lessons").update({ order_index: target.order_index }).eq("id", lessonId);
  const { error: e2 } = await supabase.from("lessons").update({ order_index: current.order_index }).eq("id", target.id);
  if (e1 || e2) {
    console.error("moveLessonAction: lessons update failed", { e1: e1?.message, e2: e2?.message });
  }
  revalidatePath("/[locale]/app", "layout");
}
