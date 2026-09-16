// ⚠️ This file should be regenerated from the live database, not hand-maintained:
//
//   supabase gen types typescript --project-id <project-ref> --schema public > types/database.types.ts
//
// The schema is already live in Supabase (26 tables, all enums, RLS, triggers,
// functions — per the approved GENHEX schema design). Run the command above
// against it to get the full, authoritative file. The slice below covers the
// tables Phase 1 (identity & auth) actually touches so the app compiles now;
// every other table follows an identical Row/Insert/Update/Relationships shape.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          genhex_id: string;
          full_name_en: string;
          full_name_ar: string;
          avatar_url: string | null;
          phone: string | null;
          locale_preference: string;
          theme_preference: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          // genhex_id is assigned by the assign_genhex_id trigger — never
          // set it from application code.
          full_name_en: string;
          full_name_ar: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale_preference?: string;
          theme_preference?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["profiles"]["Insert"], "id">>;
        Relationships: [];
      };

      courses: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en: string | null;
          description_ar: string | null;
          cover_image_url: string | null;
          instructor_id: string;
          category: string | null;
          level: Database["public"]["Enums"]["course_level"] | null;
          status: Database["public"]["Enums"]["course_status"];
          enrollment_mode: Database["public"]["Enums"]["enrollment_mode"];
          application_form_id: string | null;
          exam_requirement: Database["public"]["Enums"]["exam_requirement_type"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en?: string | null;
          description_ar?: string | null;
          cover_image_url?: string | null;
          instructor_id: string;
          category?: string | null;
          level?: Database["public"]["Enums"]["course_level"] | null;
          status?: Database["public"]["Enums"]["course_status"];
          enrollment_mode?: Database["public"]["Enums"]["enrollment_mode"];
          application_form_id?: string | null;
          exam_requirement?: Database["public"]["Enums"]["exam_requirement_type"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_application_form_id_fkey";
            columns: ["application_form_id"];
            referencedRelation: "forms";
            referencedColumns: ["id"];
          }
        ];
      };

      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          attempt_number: number;
          attendance_percent_at_start: number;
          started_at: string;
          submitted_at: string | null;
          status: Database["public"]["Enums"]["attempt_status"];
          score_percent: number | null;
          passed: boolean | null;
        };
        // Rows are created only via the start_exam_attempt() RPC
        // (service-role), never via a direct table insert.
        Insert: never;
        Update: Partial<{
          status: Database["public"]["Enums"]["attempt_status"];
          submitted_at: string;
          score_percent: number;
          passed: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey";
            columns: ["exam_id"];
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_attempts_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      course_instructors: {
        Row: {
          id: string;
          course_id: string;
          instructor_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          instructor_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_instructors"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_instructors_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      modules: {
        Row: {
          id: string;
          course_id: string;
          title_en: string;
          title_ar: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          course_id: string;
          title_en: string;
          title_ar: string;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["modules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };

      lessons: {
        Row: {
          id: string;
          module_id: string;
          title_en: string;
          title_ar: string;
          video_source: Database["public"]["Enums"]["video_source_type"];
          youtube_video_id: string | null;
          drive_url: string | null;
          duration_seconds: number;
          order_index: number;
          is_preview: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title_en: string;
          title_ar: string;
          video_source?: Database["public"]["Enums"]["video_source_type"];
          youtube_video_id?: string | null;
          drive_url?: string | null;
          duration_seconds: number;
          order_index: number;
          is_preview?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };

      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          status: Database["public"]["Enums"]["enrollment_status"];
          source_submission_id: string | null;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          status?: Database["public"]["Enums"]["enrollment_status"];
          source_submission_id?: string | null;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_source_submission_id_fkey";
            columns: ["source_submission_id"];
            referencedRelation: "form_submissions";
            referencedColumns: ["id"];
          }
        ];
      };

      lesson_progress: {
        Row: {
          id: string;
          enrollment_id: string;
          lesson_id: string;
          watched_seconds: number;
          is_completed: boolean;
          completed_at: string | null;
          last_watched_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          lesson_id: string;
          watched_seconds?: number;
          // is_completed/completed_at are server-derived by trigger from
          // watched_seconds vs. 90% of lessons.duration_seconds — never
          // set these from client code, the trigger overwrites them anyway.
          last_watched_at?: string;
        };
        Update: Partial<{
          watched_seconds: number;
          last_watched_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey";
            columns: ["enrollment_id"];
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };

      forms: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en: string | null;
          description_ar: string | null;
          field_schema: Json;
          form_type: Database["public"]["Enums"]["form_type"];
          requires_account: boolean;
          is_open: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          description_en?: string | null;
          description_ar?: string | null;
          field_schema?: Json;
          form_type: Database["public"]["Enums"]["form_type"];
          requires_account?: boolean;
          is_open?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forms"]["Insert"]>;
        Relationships: [];
      };

      form_submissions: {
        Row: {
          id: string;
          form_id: string;
          submitted_by: string | null;
          guest_email: string | null;
          data: Json;
          status: Database["public"]["Enums"]["submission_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          submitted_by?: string | null;
          guest_email?: string | null;
          data: Json;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string;
        };
        Update: Partial<{
          status: Database["public"]["Enums"]["submission_status"];
          reviewed_by: string;
          reviewed_at: string;
          review_notes: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey";
            columns: ["form_id"];
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submissions_submitted_by_fkey";
            columns: ["submitted_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      attendance_sessions: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          session_date: string;
          mode: Database["public"]["Enums"]["attendance_mode"];
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          session_date: string;
          mode?: Database["public"]["Enums"]["attendance_mode"];
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_sessions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };

      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          source: Database["public"]["Enums"]["attendance_record_source"];
          import_batch_id: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          source?: Database["public"]["Enums"]["attendance_record_source"];
          import_batch_id?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      attendance_import_batches: {
        Row: {
          id: string;
          course_id: string;
          uploaded_by: string;
          file_name: string;
          status: Database["public"]["Enums"]["import_batch_status"];
          total_rows: number;
          matched_rows: number;
          error_rows: number;
          staged_rows: Json;
          error_log: Json;
          committed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          uploaded_by: string;
          file_name: string;
          status?: Database["public"]["Enums"]["import_batch_status"];
          total_rows?: number;
          matched_rows?: number;
          error_rows?: number;
          staged_rows?: Json;
          error_log?: Json;
          committed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_import_batches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_import_batches_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };

      resources: {
        Row: {
          id: string;
          title_en: string;
          title_ar: string;
          type: Database["public"]["Enums"]["resource_type"];
          file_url: string | null;
          external_url: string | null;
          category: string | null;
          course_id: string | null;
          lesson_id: string | null;
          visibility: Database["public"]["Enums"]["resource_visibility"];
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_en: string;
          title_ar: string;
          type: Database["public"]["Enums"]["resource_type"];
          file_url?: string | null;
          external_url?: string | null;
          category?: string | null;
          course_id?: string | null;
          lesson_id?: string | null;
          visibility?: Database["public"]["Enums"]["resource_visibility"];
          uploaded_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };

      // ...remaining 12 tables (exams, exam_questions, exam_answers,
      // certificate_templates, certificates, events, event_registrations,
      // labs_projects, labs_collaborators, notifications,
      // audit_logs, background_jobs) follow the identical pattern —
      // generate the full file rather than hand-extending this stub once
      // you're ready to build those features.
    };
    Views: Record<string, never>;
    Functions: {
      attendance_percent: {
        Args: { student_id: string; course_id: string };
        Returns: number;
      };
      certificate_eligibility: {
        Args: { student_id: string; course_id: string };
        Returns: { eligible: boolean; qualifying_score: number | null };
      };
    };
    Enums: {
      user_role: "student" | "instructor" | "admin";
      video_source_type: "youtube" | "google_drive";
      course_status: "draft" | "published" | "archived";
      course_level: "beginner" | "intermediate" | "advanced";
      enrollment_mode: "open" | "application";
      exam_requirement_type: "required" | "optional" | "none";
      enrollment_status: "active" | "completed" | "withdrawn";
      attendance_mode: "onsite" | "online";
      attendance_status: "present" | "absent" | "late" | "excused";
      attendance_record_source: "manual" | "import";
      import_batch_status: "pending" | "committed" | "failed";
      exam_status: "draft" | "published" | "closed";
      question_type: "mcq" | "true_false" | "short_answer";
      attempt_status: "in_progress" | "submitted" | "graded";
      certificate_status: "active" | "revoked";
      form_type: "application" | "event_registration" | "general";
      submission_status: "pending" | "under_review" | "approved" | "rejected";
      event_type: "workshop" | "masterclass" | "lab_session" | "community";
      event_location_mode: "onsite" | "online";
      event_status: "draft" | "published" | "completed" | "cancelled";
      capacity_mode: "hard_limit" | "waitlist";
      registration_status: "registered" | "attended" | "no_show" | "cancelled" | "waitlisted";
      labs_project_status: "idea" | "prototype" | "shipped";
      resource_type: "pdf" | "link" | "video" | "dataset";
      resource_visibility: "public" | "enrolled_only" | "instructors_only";
      job_status: "queued" | "processing" | "done" | "failed";
    };
  };
}
