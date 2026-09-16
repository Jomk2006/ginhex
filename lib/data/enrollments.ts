import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getEnrollment(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * A student's enrolled courses with a computed progress percentage.
 * Progress is derived from lesson_progress rows client-side (in this
 * function) rather than trusted from anywhere else — is_completed on
 * each row is itself server/trigger-derived, so this stays honest.
 */
export async function getStudentEnrollments(studentId: string) {
  const supabase = await createClient();

  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("*, courses(id, slug, title_en, title_ar, cover_image_url, category, level)")
    .eq("student_id", studentId)
    .order("enrolled_at", { ascending: false });

  if (error) throw error;
  if (!enrollments) return [];

  const results = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, modules!inner(course_id)", { count: "exact", head: true })
          .eq("modules.course_id", enrollment.course_id),
        supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("enrollment_id", enrollment.id)
          .eq("is_completed", true),
      ]);

      const total = totalLessons ?? 0;
      const completed = completedLessons ?? 0;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { enrollment, progressPercent, totalLessons: total, completedLessons: completed };
    })
  );

  return results;
}
