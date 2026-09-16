"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { signInAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";

const initialState: AuthActionState = {};

const OAUTH_ERROR_MESSAGES: Record<string, { en: string; ar: string }> = {
  oauth: {
    en: "Google sign-in failed to start. This usually means Google sign-in isn't fully configured yet — try email/password, or contact support.",
    ar: "تعذّر بدء تسجيل الدخول بجوجل. غالبًا يعني إن الإعداد لسه مش مكتمل — جرّب البريد الإلكتروني وكلمة المرور، أو تواصل مع الدعم.",
  },
  missing_code: {
    en: "The sign-in link was incomplete. Please try again.",
    ar: "رابط تسجيل الدخول كان ناقصًا. حاول مرة أخرى.",
  },
  auth_callback_failed: {
    en: "We couldn't complete sign-in. The link may have expired — please try again.",
    ar: "تعذّر إكمال تسجيل الدخول. ربما انتهت صلاحية الرابط — حاول مرة أخرى.",
  },
};

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {oauthError && (
          <Alert variant="destructive">
            {OAUTH_ERROR_MESSAGES[oauthError]?.[isAr ? "ar" : "en"] ??
              (isAr ? "حدث خطأ أثناء تسجيل الدخول." : "Something went wrong signing in.")}
          </Alert>
        )}

        <GoogleButton />
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">{t("orContinueWith")}</span>
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />

          {state.error && <Alert variant="destructive">{tErrors(state.error as never)}</Alert>}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link href="/reset-password" className="text-xs text-primary hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            {t("signUpLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
