"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types/domain";

export interface AttendanceActionState {
  error?: string;
  success?: boolean;
}

export async function createSessionAction(
  courseId: string,
  _prevState: AttendanceActionState,
  formData: FormData
): Promise<AttendanceActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const sessionDate = String(formData.get("session_date") ?? "");
  const mode = String(formData.get("mode") ?? "onsite");

  if (!title || !sessionDate) {
    return { error: "invalidInput" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { error } = await supabase.from("attendance_sessions").insert({
    course_id: courseId,
    title,
    session_date: new Date(sessionDate).toISOString(),
    mode: mode === "online" ? "online" : "onsite",
    created_by: user.id,
  });

  if (error) {
    console.error("createSessionAction: attendance_sessions insert failed", {
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
 * Marks a single student's attendance for a session -- upsert on the
 * (session_id, student_id) unique constraint already enforced by the
 * schema, so a re-mark simply overwrites the prior status rather than
 * creating a duplicate row.
 */
export async function markAttendanceAction(sessionId: string, studentId: string, status: AttendanceStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { error } = await supabase
    .from("attendance_records")
    .upsert(
      { session_id: sessionId, student_id: studentId, status, source: "manual", recorded_by: user.id },
      { onConflict: "session_id,student_id" }
    );

  if (error) {
    console.error("markAttendanceAction: attendance_records upsert failed", {
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

/** Marks every currently-unmarked student in the roster as present in one call. */
export async function markAllPresentAction(sessionId: string, studentIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const rows = studentIds.map((studentId) => ({
    session_id: sessionId,
    student_id: studentId,
    status: "present" as const,
    source: "manual" as const,
    recorded_by: user.id,
  }));

  const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "session_id,student_id" });
  if (error) {
    console.error("markAllPresentAction: attendance_records upsert failed", {
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
