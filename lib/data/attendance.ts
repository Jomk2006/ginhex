import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCourseSessions(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("course_id", courseId)
    .order("session_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSessionById(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("attendance_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Every enrolled student in the course, with their attendance record for this specific session (if marked yet). */
export async function getSessionRoster(sessionId: string, courseId: string) {
  const supabase = await createClient();

  const [{ data: enrollments, error: enrError }, { data: records, error: recError }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("student_id, profiles(id, full_name_en, full_name_ar, genhex_id)")
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: true }),
    supabase.from("attendance_records").select("*").eq("session_id", sessionId),
  ]);
  if (enrError) throw enrError;
  if (recError) throw recError;

  const recordByStudent = new Map((records ?? []).map((r) => [r.student_id, r]));

  return (enrollments ?? [])
    .map((e) => {
      const profile = (e as unknown as { profiles: { id: string; full_name_en: string; full_name_ar: string; genhex_id: string } | null }).profiles;
      if (!profile) return null;
      return {
        studentId: e.student_id,
        fullNameEn: profile.full_name_en,
        fullNameAr: profile.full_name_ar,
        genhexId: profile.genhex_id,
        record: recordByStudent.get(e.student_id) ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

/** Present+late / total sessions held so far, using the existing attendance_percent DB function -- never computed client-side. */
export async function getStudentAttendancePercent(studentId: string, courseId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("attendance_percent", { student_id: studentId, course_id: courseId });
  if (error) return null;
  return data;
}

export async function getStudentAttendanceBreakdown(studentId: string, courseId: string) {
  const supabase = await createClient();

  const { data: sessions } = await supabase.from("attendance_sessions").select("id").eq("course_id", courseId);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) {
    return { present: 0, absent: 0, late: 0, excused: 0, totalSessions: 0 };
  }

  const { data: records } = await supabase
    .from("attendance_records")
    .select("status")
    .eq("student_id", studentId)
    .in("session_id", sessionIds);

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of records ?? []) {
    counts[r.status] += 1;
  }

  return { ...counts, totalSessions: sessionIds.length };
}
