"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export interface ResourceActionState {
  error?: string;
  success?: boolean;
}

const linkResourceSchema = z.object({
  title_en: z.string().min(1).max(150),
  title_ar: z.string().min(1).max(150),
  external_url: z.string().url(),
});

/** Attach an external link (e.g. a Google Drive share link) as a lesson material. */
export async function createLinkResourceAction(
  courseId: string,
  lessonId: string,
  formData: FormData
): Promise<ResourceActionState> {
  const parsed = linkResourceSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    external_url: formData.get("external_url"),
  });
  if (!parsed.success) return { error: "invalidInput" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { error } = await supabase.from("resources").insert({
    title_en: parsed.data.title_en,
    title_ar: parsed.data.title_ar,
    type: "link",
    external_url: parsed.data.external_url,
    course_id: courseId,
    lesson_id: lessonId,
    visibility: "enrolled_only",
    uploaded_by: user.id,
  });

  if (error) {
    console.error("createLinkResourceAction: resources insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }
  revalidatePath("/[locale]/app", "layout");
  return { success: true };
}

/**
 * Records a resource row AFTER the file has already been uploaded to
 * Storage client-side (browser client, respects the storage.objects
 * INSERT RLS policy directly -- this action never touches file bytes,
 * it only records the metadata once the upload itself already
 * succeeded and was already authorized by Storage's own RLS).
 */
const fileResourceSchema = z.object({
  title_en: z.string().min(1).max(150),
  title_ar: z.string().min(1).max(150),
  storagePath: z.string().min(1),
});

export async function recordUploadedResourceAction(
  courseId: string,
  lessonId: string,
  formData: FormData
): Promise<ResourceActionState> {
  const parsed = fileResourceSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    storagePath: formData.get("storagePath"),
  });
  if (!parsed.success) return { error: "invalidInput" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { error } = await supabase.from("resources").insert({
    title_en: parsed.data.title_en,
    title_ar: parsed.data.title_ar,
    type: "dataset",
    file_url: parsed.data.storagePath,
    course_id: courseId,
    lesson_id: lessonId,
    visibility: "enrolled_only",
    uploaded_by: user.id,
  });

  if (error) {
    console.error("recordUploadedResourceAction: resources insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }
  revalidatePath("/[locale]/app", "layout");
  return { success: true };
}

export async function deleteResourceAction(resourceId: string, storagePath: string | null) {
  const supabase = await createClient();

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from("course-materials").remove([storagePath]);
    if (storageError) {
      console.error("deleteResourceAction: storage remove failed", storageError.message);
    }
  }
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) {
    console.error("deleteResourceAction: resources delete failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
  revalidatePath("/[locale]/app", "layout");
}
