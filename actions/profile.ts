"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

/**
 * Updates the signed-in user's own profile fields only. Deliberately
 * never touches `role` — that column is admin-only, protected by a
 * database trigger regardless of what this action sends, but this
 * action doesn't even attempt it, so there's no confusing failure mode
 * if a student/instructor session somehow reached this code.
 */
export async function updateProfileAction(
  locale: string,
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    full_name_en: formData.get("full_name_en"),
    full_name_ar: formData.get("full_name_ar"),
    phone: formData.get("phone"),
    avatar_url: formData.get("avatar_url"),
  });
  if (!parsed.success) {
    return { error: "invalidInput" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "signInRequired" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name_en: parsed.data.full_name_en,
      full_name_ar: parsed.data.full_name_ar,
      phone: parsed.data.phone || null,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfileAction: profiles update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }

  revalidatePath(`/${locale}/app/profile`);
  revalidatePath(`/${locale}/app`);
  return { success: true };
}
