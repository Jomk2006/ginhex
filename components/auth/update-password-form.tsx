"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updatePasswordAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const initialState: AuthActionState = {};

export function UpdatePasswordForm() {
  const t = useTranslations("auth.updatePassword");
  const tErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

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
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
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
      </CardContent>
    </Card>
  );
}
