"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { enrollOpenAction } from "@/actions/enrollment";
import type { Course } from "@/types/domain";

const MESSAGES: Record<string, { en: string; ar: string }> = {
  signInRequired: { en: "Sign in to enroll.", ar: "سجّل الدخول للتسجيل في الدورة." },
  alreadyEnrolled: { en: "You're already enrolled.", ar: "أنت مسجَّل بالفعل في هذه الدورة." },
  generic: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. حاول مرة أخرى." },
};

export function EnrollmentButton({
  course,
  isSignedIn,
  isEnrolled,
}: {
  course: Pick<Course, "id" | "slug" | "enrollment_mode">;
  isSignedIn: boolean;
  isEnrolled: boolean;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isEnrolled) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={`/app/student/courses/${course.slug}/learn`}>
          {isAr ? "متابعة التعلّم" : "Continue learning"}
        </Link>
      </Button>
    );
  }

  if (course.enrollment_mode === "application") {
    return (
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href={`/courses/${course.slug}/apply`}>{isAr ? "قدّم الآن" : "Apply now"}</Link>
      </Button>
    );
  }

  function handleEnroll() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_to=/${locale}/courses/${course.slug}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await enrollOpenAction(course.id, course.slug, locale);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert variant="destructive">{MESSAGES[error]?.[isAr ? "ar" : "en"] ?? error}</Alert>}
      <Button size="lg" className="w-full" onClick={handleEnroll} disabled={isPending}>
        {isAr ? "التسجيل في الدورة" : "Enroll now"}
      </Button>
    </div>
  );
}
