import { z } from "zod";

export const profileSchema = z.object({
  full_name_en: z.string().min(2).max(120),
  full_name_ar: z.string().min(2).max(120),
  phone: z.string().max(30).optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;
