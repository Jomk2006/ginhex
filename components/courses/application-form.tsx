"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { submitFormAction } from "@/actions/forms";
import type { FormFieldSchema } from "@/types/domain";

const MESSAGES: Record<string, { en: string; ar: string }> = {
  signInRequired: { en: "Sign in to submit this application.", ar: "سجّل الدخول لتقديم الطلب." },
  emailRequired: { en: "Please provide an email address.", ar: "يرجى إدخال بريد إلكتروني." },
  missingRequiredField: { en: "Please fill in all required fields.", ar: "يرجى تعبئة جميع الحقول المطلوبة." },
  generic: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. حاول مرة أخرى." },
};

export function ApplicationForm({
  formId,
  fieldSchema,
  requiresAccount,
  isSignedIn,
}: {
  formId: string;
  fieldSchema: FormFieldSchema[];
  requiresAccount: boolean;
  isSignedIn: boolean;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitFormAction(formId, fieldSchema, requiresAccount, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <Alert variant="success">
        {isAr
          ? "تم استلام طلبك بنجاح. سيتم مراجعته من قِبل فريق GENHEX."
          : "Your application was submitted. The GENHEX team will review it."}
      </Alert>
    );
  }

  if (requiresAccount && !isSignedIn) {
    return <Alert variant="destructive">{MESSAGES.signInRequired[isAr ? "ar" : "en"]}</Alert>;
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="destructive">{MESSAGES[error]?.[isAr ? "ar" : "en"] ?? error}</Alert>}

      {!requiresAccount && !isSignedIn && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="guest_email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
          <Input id="guest_email" name="guest_email" type="email" required />
        </div>
      )}

      {fieldSchema.map((field) => {
        const label = isAr ? field.label_ar : field.label_en;
        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label htmlFor={field.name}>
              {label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            {field.type === "textarea" ? (
              <Textarea id={field.name} name={field.name} required={field.required} />
            ) : field.type === "select" ? (
              <Select id={field.name} name={field.name} required={field.required} defaultValue="">
                <option value="" disabled>
                  {isAr ? "اختر..." : "Select..."}
                </option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.label_ar : opt.label_en}
                  </option>
                ))}
              </Select>
            ) : (
              <Input id={field.name} name={field.name} type={field.type} required={field.required} />
            )}
          </div>
        );
      })}

      <Button type="submit" disabled={isPending} className="w-full">
        {isAr ? "إرسال الطلب" : "Submit application"}
      </Button>
    </form>
  );
}
