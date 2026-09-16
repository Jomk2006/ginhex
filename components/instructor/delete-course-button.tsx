"use client";

import { useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteCourseAction } from "@/actions/courses-admin";

export function DeleteCourseButton({
  courseId,
  courseTitle,
  editBase,
  className,
}: {
  courseId: string;
  courseTitle: string;
  editBase: "app/instructor" | "app/admin";
  className?: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const boundDelete = deleteCourseAction.bind(null, courseId, editBase, locale);

  return (
    <form
      action={boundDelete}
      onSubmit={(e) => {
        const message = isAr
          ? `متأكد إنك عايز تحذف "${courseTitle}"؟ هيتم حذف كل الموديولات والدروس والمواد اللي جواها، والإجراء ده مش قابل للتراجع.`
          : `Delete "${courseTitle}"? This removes all its modules, lessons, and materials — this can't be undone.`;
        if (!confirm(message)) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isAr ? "حذف الدورة" : "Delete course"}
      </button>
    </form>
  );
}
