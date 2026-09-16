"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";
import { USER_ROLES } from "@/types/domain";

export interface AdminActionState {
  error?: string;
  success?: boolean;
}

/**
 * Every function here re-checks that the caller's own profile.role is
 * 'admin' before doing anything — this is defense in depth, not the
 * only guard. The real boundary is the database: the `role` column can
 * only be changed by an admin per the existing trigger, and RLS scopes
 * every other write here too, regardless of what this server code does.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") return { supabase, ok: false as const };

  return { supabase, ok: true as const, adminId: user.id };
}

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole,
  locale: string
): Promise<AdminActionState> {
  if (!USER_ROLES.includes(newRole)) {
    return { error: "invalidInput" };
  }

  const admin = await requireAdmin();
  if (!admin.ok) {
    return { error: "notAuthorized" };
  }

  const { error } = await admin.supabase.from("profiles").update({ role: newRole }).eq("id", targetUserId);
  if (error) {
    console.error("updateUserRoleAction: profiles update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }

  revalidatePath(`/${locale}/app/admin/users`);
  return { success: true };
}

export async function toggleUserActiveAction(
  targetUserId: string,
  isActive: boolean,
  locale: string
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { error: "notAuthorized" };
  }

  const { error } = await admin.supabase.from("profiles").update({ is_active: isActive }).eq("id", targetUserId);
  if (error) {
    console.error("toggleUserActiveAction: profiles update failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: "generic" };
  }

  revalidatePath(`/${locale}/app/admin/users`);
  return { success: true };
}
