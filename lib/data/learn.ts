import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCourseCurriculum(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .select("id, title_en, title_ar, order_index, lessons(*)")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((m) => ({
    ...m,
    lessons: (m.lessons ?? []).sort((a, b) => a.order_index - b.order_index),
  }));
}

export async function getEnrollmentProgressMap(enrollmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("enrollment_id", enrollmentId);
  if (error) throw error;

  const map = new Map<string, (typeof data)[number]>();
  for (const row of data ?? []) {
    map.set(row.lesson_id, row);
  }
  return map;
}

export async function getLessonById(lessonId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
  if (error) throw error;
  return data;
}
