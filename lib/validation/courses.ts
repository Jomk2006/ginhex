import { z } from "zod";

export const courseSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, numbers, and hyphens only"),
    title_en: z.string().min(3).max(150),
    title_ar: z.string().min(3).max(150),
    description_en: z.string().max(4000).optional().or(z.literal("")),
    description_ar: z.string().max(4000).optional().or(z.literal("")),
    cover_image_url: z.string().url().optional().or(z.literal("")),
    category: z.string().max(60).optional().or(z.literal("")),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    status: z.enum(["draft", "published", "archived"]),
    enrollment_mode: z.enum(["open", "application"]),
    application_form_id: z.string().uuid().optional().or(z.literal("")),
    exam_requirement: z.enum(["required", "optional", "none"]),
  })
  .refine((data) => data.enrollment_mode !== "application" || !!data.application_form_id, {
    message: "An application form ID is required when enrollment is application-gated.",
    path: ["application_form_id"],
  });
export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  title_en: z.string().min(2).max(150),
  title_ar: z.string().min(2).max(150),
  order_index: z.coerce.number().int().min(0),
});
export type ModuleInput = z.infer<typeof moduleSchema>;

export const lessonSchema = z
  .object({
    title_en: z.string().min(2).max(150),
    title_ar: z.string().min(2).max(150),
    video_source: z.enum(["youtube", "google_drive"]).default("youtube"),
    youtube_video_id: z.string().max(30).optional().or(z.literal("")),
    drive_url: z.string().max(500).optional().or(z.literal("")),
    duration_seconds: z.coerce.number().int().min(1),
    order_index: z.coerce.number().int().min(0),
    is_preview: z.coerce.boolean().optional(),
  })
  .refine((data) => data.video_source !== "youtube" || !!data.youtube_video_id, {
    message: "YouTube video ID is required for YouTube-sourced lessons.",
    path: ["youtube_video_id"],
  })
  .refine((data) => data.video_source !== "google_drive" || !!data.drive_url, {
    message: "A Google Drive link is required for Drive-sourced lessons.",
    path: ["drive_url"],
  });
export type LessonInput = z.infer<typeof lessonSchema>;
