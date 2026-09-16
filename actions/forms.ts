"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type { FormFieldSchema } from "@/types/domain";

export interface SubmitFormActionState {
  error?: string;
  success?: boolean;
}

/**
 * Generic form_submissions writer, driven by forms.field_schema. Used for
 * application-gated course enrollment today; the same action works for any
 * `forms` row since the schema is fully data-driven.
 *
 * This does NOT create an `enrollments` row — application-gated enrollment
 * only happens after an admin approves the submission (see schema design
 * §6.3 — the `validate_application_enrollment` trigger requires an
 * *approved* source_submission_id). That approval workflow is a later
 * phase; this action only gets the submission into the review queue.
 */
export async function submitFormAction(
  formId: string,
  fieldSchema: FormFieldSchema[],
  requiresAccount: boolean,
  formData: FormData
): Promise<SubmitFormActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (requiresAccount && !user) {
    return { error: "signInRequired" };
  }

  const guestEmail = String(formData.get("guest_email") ?? "").trim();
  if (!requiresAccount && !user && !guestEmail) {
    return { error: "emailRequired" };
  }

  const data: Record<string, Json> = {};
  for (const field of fieldSchema) {
    const value = formData.get(field.name);
    if (field.required && (!value || String(value).trim() === "")) {
      return { error: "missingRequiredField" };
    }
    data[field.name] = value ? String(value) : null;
  }

  const { error } = await supabase.from("form_submissions").insert({
    form_id: formId,
    submitted_by: user?.id ?? null,
    guest_email: user ? null : guestEmail || null,
    data,
  });

  if (error) {
    console.error("submitFormAction: form_submissions insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }

  return { success: true };
}
