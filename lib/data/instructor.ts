import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Courses where this profile is the primary owner OR a co-instructor. */
export async function getInstructorCourses(instructorId: string) {
  const supabase = await createClient();

  const { data: coTaught, error: coError } = await supabase
    .from("course_instructors")
    .select("course_id")
    .eq("instructor_id", instructorId);
  if (coError) throw coError;

  const courseIds = Array.from(new Set((coTaught ?? []).map((r) => r.course_id)));

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .or(
      courseIds.length > 0
        ? `instructor_id.eq.${instructorId},id.in.(${courseIds.join(",")})`
        : `instructor_id.eq.${instructorId}`
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getInstructorCourseById(courseId: string) {
  const supabase = await createClient();
  const { data: course, error } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const { data: modules, error: modError } = await supabase
    .from("modules")
    .select("*, lessons(*, resources(id, title_en, title_ar, type, file_url, external_url))")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (modError) throw modError;

  return {
    course,
    modules: (modules ?? []).map((m) => ({
      ...m,
      lessons: (m.lessons ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => ({ ...l, resources: l.resources ?? [] })),
    })),
  };
}

/** Distinct students enrolled across every course this instructor owns/co-teaches. */
export async function getInstructorStudentCount(instructorId: string) {
  const supabase = await createClient();
  const courses = await getInstructorCourses(instructorId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return 0;

  const { data, error } = await supabase
    .from("enrollments")
    .select("student_id")
    .in("course_id", courseIds);
  if (error) throw error;

  return new Set((data ?? []).map((e) => e.student_id)).size;
}
