"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPasswordResetAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success === "resetEmailSent" ? (
          <Alert variant="success">{t("success")}</Alert>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            {state.error && <Alert variant="destructive">{tErrors(state.error as never)}</Alert>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {t("submit")}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="text-primary hover:underline">
            {t("backToSignIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
