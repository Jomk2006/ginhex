"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProgressResult {
  ok: boolean;
  isCompleted?: boolean;
}

/**
 * Records watched_seconds for a lesson. Never regresses progress (takes
 * the max of what's stored vs. what's reported, so a seek-back or a
 * stale/duplicate report can't erase completion). is_completed itself is
 * NOT set here — the `recompute_lesson_completion` trigger on
 * lesson_progress derives it server-side from watched_seconds vs. 90% of
 * lessons.duration_seconds, so a client can't fake completion.
 */
export async function updateLessonProgressAction(
  enrollmentId: string,
  lessonId: string,
  watchedSeconds: number,
  revalidate?: { locale: string; courseSlug: string }
): Promise<UpdateProgressResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Defense in depth — RLS also enforces this via enrollment_id ownership.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, student_id")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (!enrollment || enrollment.student_id !== user.id) {
    return { ok: false };
  }

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("id, watched_seconds, is_completed")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const nextWatched = Math.max(existing?.watched_seconds ?? 0, Math.floor(watchedSeconds));

  if (existing) {
    const { data, error } = await supabase
      .from("lesson_progress")
      .update({ watched_seconds: nextWatched, last_watched_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("is_completed")
      .single();
    if (error) return { ok: false };
    if (revalidate) {
      revalidatePath(`/${revalidate.locale}/app/student/courses/${revalidate.courseSlug}/learn`);
    }
    return { ok: true, isCompleted: data.is_completed };
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .insert({ enrollment_id: enrollmentId, lesson_id: lessonId, watched_seconds: nextWatched })
    .select("is_completed")
    .single();
  if (error) return { ok: false };
  if (revalidate) {
    revalidatePath(`/${revalidate.locale}/app/student/courses/${revalidate.courseSlug}/learn`);
  }
  return { ok: true, isCompleted: data.is_completed };
}
