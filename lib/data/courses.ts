import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CourseLevel } from "@/types/domain";

export interface CourseListFilters {
  search?: string;
  category?: string;
  level?: CourseLevel;
}

/**
 * Published courses only — RLS on `courses` already restricts non-admin,
 * non-owning-instructor sessions to `status = 'published'`, so this query
 * doesn't need to filter status explicitly, but it's kept explicit here
 * for readability and to fail closed if RLS is ever misconfigured.
 */
export async function getPublishedCourses(filters: CourseListFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select(
      "id, slug, title_en, title_ar, description_en, description_ar, cover_image_url, category, level, enrollment_mode, exam_requirement, instructor_id, status"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.level) {
    query = query.eq("level", filters.level);
  }
  if (filters.search) {
    query = query.or(
      `title_en.ilike.%${filters.search}%,title_ar.ilike.%${filters.search}%,description_en.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCourseCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);
  if (error) throw error;
  return Array.from(new Set(data.map((c) => c.category).filter((c): c is string => !!c)));
}

export async function getCourseBySlug(slug: string) {
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!course) return null;

  const [{ data: instructor }, { data: modules }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name_en, full_name_ar, avatar_url")
      .eq("id", course.instructor_id)
      .maybeSingle(),
    supabase
      .from("modules")
      .select("id, title_en, title_ar, order_index, lessons(id, title_en, title_ar, duration_seconds, order_index, is_preview)")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true }),
  ]);

  const sortedModules = (modules ?? []).map((m) => ({
    ...m,
    lessons: (m.lessons ?? []).sort((a, b) => a.order_index - b.order_index),
  }));

  return { course, instructor, modules: sortedModules };
}
