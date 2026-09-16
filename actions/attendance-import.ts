"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { parseAttendanceFile, extractRowFields } from "@/lib/import/parse-attendance-file";
import type { AttendanceStatus } from "@/types/domain";

export interface StagedRow {
  rawName: string;
  rawEmail: string;
  rawGenhexId: string;
  status: AttendanceStatus;
  matchedStudentId: string | null;
  matchedName: string | null;
  outcome: "matched" | "duplicate" | "not_enrolled" | "unrecognized";
}

export interface StageImportResult {
  error?: string;
  batchId?: string;
  rows?: StagedRow[];
  summary?: { matched: number; duplicates: number; notEnrolled: number; invalid: number; total: number };
}

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function normalizeStatus(raw: string): AttendanceStatus {
  const lower = raw.toLowerCase().trim();
  if ((VALID_STATUSES as string[]).includes(lower)) return lower as AttendanceStatus;
  return "present"; // no status column / unrecognized value -> default to present, matching "mark all present" semantics
}

export async function stageAttendanceImportAction(
  courseId: string,
  sessionId: string,
  formData: FormData
): Promise<StageImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  // Authorization: is_instructor_of(course) or admin -- RLS on the
  // underlying inserts enforces this too, but check explicitly here so
  // we can give a clear error before doing any file parsing work.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: course } = await supabase.from("courses").select("instructor_id").eq("id", courseId).maybeSingle();
  const isOwner = course?.instructor_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) {
    const { data: coTeaching } = await supabase
      .from("course_instructors")
      .select("id")
      .eq("course_id", courseId)
      .eq("instructor_id", user.id)
      .maybeSingle();
    if (!coTeaching) return { error: "notAuthorized" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "noFile" };

  let parsedRows;
  try {
    const buffer = await file.arrayBuffer();
    parsedRows = parseAttendanceFile(buffer);
  } catch {
    return { error: "parseFailed" };
  }

  if (parsedRows.length === 0) return { error: "emptyFile" };

  // Roster: enrolled students in this course, with email (service-role
  // needed since auth.users isn't reachable through the normal RLS
  // client) and genhex_id, to match uploaded rows against.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, profiles(id, full_name_en, full_name_ar, genhex_id)")
    .eq("course_id", courseId);

  const serviceRole = createServiceRoleClient();
  const { data: usersPage } = await serviceRole.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map(usersPage?.users.map((u) => [u.id, (u.email ?? "").toLowerCase()]) ?? []);

  const roster = (enrollments ?? [])
    .map((e) => {
      const p = (e as unknown as { profiles: { id: string; full_name_en: string; genhex_id: string } | null }).profiles;
      if (!p) return null;
      return { studentId: p.id, name: p.full_name_en, genhexId: p.genhex_id, email: emailById.get(p.id) ?? "" };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const byGenhexId = new Map(roster.map((r) => [r.genhexId.toLowerCase(), r]));
  const byEmail = new Map(roster.filter((r) => r.email).map((r) => [r.email, r]));

  const seenStudentIds = new Set<string>();
  const stagedRows: StagedRow[] = parsedRows.map((raw) => {
    const fields = extractRowFields(raw);
    const status = normalizeStatus(fields.status);

    if (!fields.genhexId && !fields.email) {
      return {
        rawName: fields.name,
        rawEmail: fields.email,
        rawGenhexId: fields.genhexId,
        status,
        matchedStudentId: null,
        matchedName: null,
        outcome: "unrecognized",
      };
    }

    const match = (fields.genhexId && byGenhexId.get(fields.genhexId.toLowerCase())) || (fields.email && byEmail.get(fields.email.toLowerCase()));

    if (!match) {
      return {
        rawName: fields.name,
        rawEmail: fields.email,
        rawGenhexId: fields.genhexId,
        status,
        matchedStudentId: null,
        matchedName: null,
        outcome: "not_enrolled",
      };
    }

    if (seenStudentIds.has(match.studentId)) {
      return {
        rawName: fields.name,
        rawEmail: fields.email,
        rawGenhexId: fields.genhexId,
        status,
        matchedStudentId: match.studentId,
        matchedName: match.name,
        outcome: "duplicate",
      };
    }
    seenStudentIds.add(match.studentId);

    return {
      rawName: fields.name,
      rawEmail: fields.email,
      rawGenhexId: fields.genhexId,
      status,
      matchedStudentId: match.studentId,
      matchedName: match.name,
      outcome: "matched",
    };
  });

  const summary = {
    matched: stagedRows.filter((r) => r.outcome === "matched").length,
    duplicates: stagedRows.filter((r) => r.outcome === "duplicate").length,
    notEnrolled: stagedRows.filter((r) => r.outcome === "not_enrolled").length,
    invalid: stagedRows.filter((r) => r.outcome === "unrecognized").length,
    total: stagedRows.length,
  };

  const { data: batch, error: batchError } = await supabase
    .from("attendance_import_batches")
    .insert({
      course_id: courseId,
      uploaded_by: user.id,
      file_name: file.name,
      status: "pending",
      total_rows: summary.total,
      matched_rows: summary.matched,
      error_rows: summary.notEnrolled + summary.invalid,
      staged_rows: { sessionId, rows: stagedRows } as never,
      error_log: [] as never,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    console.error("stageAttendanceImportAction: attendance_import_batches insert failed", {
      code: batchError?.code,
      message: batchError?.message,
      details: batchError?.details,
      hint: batchError?.hint,
    });
    return { error: "generic" };
  }

  return { batchId: batch.id, rows: stagedRows, summary };
}

export interface CommitImportResult {
  error?: string;
  imported?: number;
}

export async function commitAttendanceImportAction(batchId: string): Promise<CommitImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { data: batch } = await supabase.from("attendance_import_batches").select("*").eq("id", batchId).maybeSingle();
  if (!batch || batch.status !== "pending") return { error: "invalidBatch" };

  const staged = batch.staged_rows as unknown as { sessionId: string; rows: StagedRow[] };
  const matchedRows = staged.rows.filter((r) => r.outcome === "matched" && r.matchedStudentId);

  if (matchedRows.length > 0) {
    const records = matchedRows.map((r) => ({
      session_id: staged.sessionId,
      student_id: r.matchedStudentId as string,
      status: r.status,
      source: "import" as const,
      import_batch_id: batchId,
      recorded_by: user.id,
    }));

    const { error: insertError } = await supabase
      .from("attendance_records")
      .upsert(records, { onConflict: "session_id,student_id" });
    if (insertError) {
      console.error("commitAttendanceImportAction: attendance_records upsert failed", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return { error: "generic" };
    }
  }

  const { error: commitError } = await supabase
    .from("attendance_import_batches")
    .update({ status: "committed", committed_at: new Date().toISOString() })
    .eq("id", batchId);
  if (commitError) {
    console.error("commitAttendanceImportAction: attendance_import_batches update failed", {
      code: commitError.code,
      message: commitError.message,
      details: commitError.details,
      hint: commitError.hint,
    });
  }

  revalidatePath("/[locale]/app", "layout");
  return { imported: matchedRows.length };
}
