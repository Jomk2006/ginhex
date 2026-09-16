"use client";

import { useLocale, useTranslations } from "next-intl";
import { signInWithGoogleAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  const t = useTranslations("auth.signIn");
  const locale = useLocale();

  return (
    <form action={signInWithGoogleAction}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="outline" className="w-full">
        {t("google")}
      </Button>
    </form>
  );
}
