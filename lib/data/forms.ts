import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getFormById(formId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("forms").select("*").eq("id", formId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getExistingSubmission(formId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("form_id", formId)
    .eq("submitted_by", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
