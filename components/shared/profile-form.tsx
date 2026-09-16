"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import type { Profile } from "@/types/domain";

const MESSAGES: Record<string, { en: string; ar: string }> = {
  invalidInput: { en: "Please check the fields and try again.", ar: "من فضلك راجع الحقول وحاول مرة أخرى." },
  signInRequired: { en: "Your session expired — please sign in again.", ar: "انتهت الجلسة — سجّل الدخول مرة أخرى." },
  generic: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. حاول مرة أخرى." },
};

const initialState: ProfileActionState = {};

export function ProfileForm({ profile, locale }: { profile: Profile; locale: string }) {
  const isAr = locale === "ar";
  const boundAction = updateProfileAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && <Alert variant="destructive">{MESSAGES[state.error]?.[isAr ? "ar" : "en"] ?? state.error}</Alert>}
      {state.success && (
        <Alert variant="success">{isAr ? "تم حفظ التعديلات بنجاح." : "Your profile was updated."}</Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name_en">{isAr ? "الاسم (إنجليزي)" : "Full name (English)"}</Label>
          <Input id="full_name_en" name="full_name_en" defaultValue={profile.full_name_en} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name_ar">{isAr ? "الاسم (عربي)" : "Full name (Arabic)"}</Label>
          <Input id="full_name_ar" name="full_name_ar" dir="rtl" defaultValue={profile.full_name_ar} required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{isAr ? "رقم الهاتف" : "Phone"}</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="avatar_url">{isAr ? "رابط الصورة الشخصية" : "Avatar URL"}</Label>
        <Input id="avatar_url" name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ""} placeholder="https://..." />
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isAr ? "حفظ التعديلات" : "Save changes"}
      </Button>
    </form>
  );
}
