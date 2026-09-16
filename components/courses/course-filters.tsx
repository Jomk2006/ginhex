"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COURSE_LEVEL_LABELS } from "@/types/domain";

export function CourseFilters({ categories }: { categories: string[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        defaultValue={searchParams.get("search") ?? ""}
        placeholder={isAr ? "ابحث عن دورة..." : "Search courses..."}
        onChange={(e) => setParam("search", e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
        className="sm:max-w-[180px]"
      >
        <option value="">{isAr ? "كل الفئات" : "All categories"}</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={searchParams.get("level") ?? ""}
        onChange={(e) => setParam("level", e.target.value)}
        className="sm:max-w-[180px]"
      >
        <option value="">{isAr ? "كل المستويات" : "All levels"}</option>
        {(["beginner", "intermediate", "advanced"] as const).map((level) => (
          <option key={level} value={level}>
            {COURSE_LEVEL_LABELS[level][isAr ? "ar" : "en"]}
          </option>
        ))}
      </Select>
    </div>
  );
}
