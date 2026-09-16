"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { updateUserRoleAction, toggleUserActiveAction } from "@/actions/admin-users";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, USER_ROLES } from "@/types/domain";
import type { Profile, UserRole } from "@/types/domain";

type ProfileWithEmail = Profile & { email: string };

const FILTERS: Array<{ value: UserRole | "all"; en: string; ar: string }> = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "student", en: "Students", ar: "الطلاب" },
  { value: "instructor", en: "Instructors", ar: "المدرّبون" },
  { value: "admin", en: "Admins", ar: "المسؤولون" },
];

export function UsersTable({ profiles, currentUserId }: { profiles: ProfileWithEmail[]; currentUserId: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [rows, setRows] = useState(profiles);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRows = roleFilter === "all" ? rows : rows.filter((p) => p.role === roleFilter);

  function handleRoleChange(userId: string, newRole: UserRole) {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRole, locale);
      if (result.error) {
        setError(result.error);
      } else {
        setRows((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
      }
    });
  }

  function handleToggleActive(userId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, nextActive, locale);
      if (result.error) {
        setError(result.error);
      } else {
        setRows((prev) => prev.map((p) => (p.id === userId ? { ...p, is_active: nextActive } : p)));
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          {isAr ? "حدث خطأ أثناء التحديث. حاول مرة أخرى." : "Something went wrong updating that user. Please try again."}
        </Alert>
      )}

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? rows.length : rows.filter((p) => p.role === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setRoleFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                roleFilter === f.value ? "bg-[#00BCC8] text-[#0A0A0A]" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? f.ar : f.en} ({count})
            </button>
          );
        })}
      </div>

      {/* Table on larger screens */}
      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-start text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "الاسم" : "Name"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "معرّف GENHEX" : "GENHEX ID"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "الدور" : "Role"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "تاريخ الانضمام" : "Joined"}</th>
              <th className="px-4 py-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.map((profile) => (
              <tr key={profile.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{isAr ? profile.full_name_ar : profile.full_name_en}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{profile.genhex_id}</td>
                <td className="px-4 py-3">
                  <Select
                    value={profile.role}
                    disabled={isPending || profile.id === currentUserId}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                    className="h-8 w-36 text-xs"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role][isAr ? "ar" : "en"]}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={profile.is_active ? "default" : "muted"}>
                      {profile.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطّل" : "Deactivated")}
                    </Badge>
                    {profile.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleToggleActive(profile.id, !profile.is_active)}
                      >
                        {profile.is_active ? (isAr ? "تعطيل" : "Deactivate") : (isAr ? "تفعيل" : "Activate")}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards on mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filteredRows.map((profile) => (
          <div key={profile.id} className="rounded-lg border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{isAr ? profile.full_name_ar : profile.full_name_en}</span>
              <Badge variant={profile.is_active ? "default" : "muted"}>
                {profile.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطّل" : "Deactivated")}
              </Badge>
            </div>
            <div className="mb-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <span>{profile.email}</span>
              <span className="font-mono">{profile.genhex_id}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Select
                value={profile.role}
                disabled={isPending || profile.id === currentUserId}
                onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                className="h-8 flex-1 text-xs"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role][isAr ? "ar" : "en"]}
                  </option>
                ))}
              </Select>
              {profile.id !== currentUserId && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleToggleActive(profile.id, !profile.is_active)}
                >
                  {profile.is_active ? (isAr ? "تعطيل" : "Deactivate") : (isAr ? "تفعيل" : "Activate")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
