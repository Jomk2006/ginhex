"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUpAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state.success === "confirmEmail") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="success">Check your email to confirm your account.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />

          {state.error && <Alert variant="destructive">{tErrors(state.error as never)}</Alert>}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullNameEn">{t("fullNameEn")}</Label>
            <Input id="fullNameEn" name="fullNameEn" type="text" autoComplete="name" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullNameAr">{t("fullNameAr")}</Label>
            <Input id="fullNameAr" name="fullNameAr" type="text" dir="rtl" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {t("submit")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
