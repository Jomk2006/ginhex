"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";
import { ROLE_HOME_PATH, type UserRole } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface AuthActionState {
  error?: string;
  success?: string;
}

function localePrefix(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  return locale === "ar" ? "/ar" : "/en";
}

/**
 * Reads the signed-in user's role from profiles.role — the same table
 * RLS trusts as the source of truth — rather than a JWT custom claim,
 * which needs a "Customize Access Token" Auth Hook configured in the
 * Supabase dashboard that this project never had, so the claim was
 * always empty and everyone routed as "student" after signing in.
 */
async function getRole(supabase: SupabaseClient<Database>, userId: string): Promise<UserRole> {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return profile?.role ?? "student";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalidCredentials" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.session) {
    return { error: "invalidCredentials" };
  }

  const role = await getRole(supabase, data.session.user.id);
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullNameEn: formData.get("fullNameEn"),
    fullNameAr: formData.get("fullNameAr"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "generic" };
  }

  const supabase = await createClient();
  // full_name_en / full_name_ar are passed as user metadata — the existing
  // Postgres trigger (already live on the schema) reads this metadata to
  // populate the NOT NULL profiles.full_name_en/full_name_ar columns on
  // auth.users insert. This action does not write to profiles directly.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name_en: parsed.data.fullNameEn,
        full_name_ar: parsed.data.fullNameAr,
      },
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message.toLowerCase().includes("already") ? "emailInUse" : "generic" };
  }

  // If email confirmation is required, there is no session yet.
  if (!data.session) {
    return { success: "confirmEmail" };
  }

  const role = await getRole(supabase, data.session.user.id);
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "generic" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${localePrefix(
      formData
    )}/update-password`,
  });

  // Deliberately do not reveal whether the email exists — same success
  // message either way to avoid account enumeration.
  if (error) {
    return { error: "generic" };
  }
  return { success: "resetEmailSent" };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message === "passwordMismatch" ? "passwordMismatch" : "weakPassword" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "generic" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${localePrefix(formData)}/sign-in`);
  }

  const role = await getRole(supabase, user.id);
  redirect(`${localePrefix(formData)}${ROLE_HOME_PATH[role]}`);
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "en");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?locale=${locale}`,
    },
  });

  if (error || !data.url) {
    redirect(`${localePrefix(formData)}/sign-in?error=oauth`);
  }
  redirect(data.url);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`${localePrefix(formData)}/sign-in`);
}
