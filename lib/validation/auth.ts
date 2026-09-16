import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullNameEn: z.string().min(2).max(120),
  fullNameAr: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
