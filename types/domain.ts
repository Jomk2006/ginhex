import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export const USER_ROLES: readonly UserRole[] = ["student", "instructor", "admin"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseInstructor = Database["public"]["Tables"]["course_instructors"]["Row"];
export type CourseModule = Database["public"]["Tables"]["modules"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
export type FormRow = Database["public"]["Tables"]["forms"]["Row"];
export type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"];
export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type AttendanceSession = Database["public"]["Tables"]["attendance_sessions"]["Row"];
export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type VideoSource = Database["public"]["Enums"]["video_source_type"];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { en: string; ar: string }> = {
  present: { en: "Present", ar: "حاضر" },
  absent: { en: "Absent", ar: "غائب" },
  late: { en: "Late", ar: "متأخر" },
  excused: { en: "Excused", ar: "معذور" },
};

export const RESOURCE_TYPE_EXTENSIONS: Record<Database["public"]["Enums"]["resource_type"], string[]> = {
  pdf: [".pdf"],
  link: [],
  video: [".mp4", ".mov", ".webm"],
  dataset: [".csv", ".xlsx", ".xls", ".zip", ".doc", ".docx", ".ppt", ".pptx"],
};

export type CourseLevel = NonNullable<Course["level"]>;
export const COURSE_LEVEL_LABELS: Record<CourseLevel, { en: string; ar: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
};

/** A lesson counts as watched once 90% of its duration has been viewed. */
export const LESSON_COMPLETION_THRESHOLD = 0.9;

/** Simple declarative field schema stored in forms.field_schema (jsonb). */
export interface FormFieldSchema {
  name: string;
  label_en: string;
  label_ar: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ value: string; label_en: string; label_ar: string }>;
}

export type Locale = "en" | "ar";
export const LOCALES: readonly Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

/** Where the role-aware dashboard root lives, per role. */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  student: "/app/student",
  instructor: "/app/instructor",
  admin: "/app/admin",
};

/** Prefix → role this segment is restricted to, checked in middleware.ts. */
export const ROLE_SEGMENT_GUARDS: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/app/student", role: "student" },
  { prefix: "/app/instructor", role: "instructor" },
  { prefix: "/app/admin", role: "admin" },
];

export const ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  student: { en: "Student", ar: "طالب" },
  instructor: { en: "Instructor", ar: "مدرّب" },
  admin: { en: "Admin", ar: "مسؤول" },
};
