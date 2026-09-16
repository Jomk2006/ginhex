"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/domain";

export function LocaleSwitcher({ onDark }: { onDark?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label="Switch language"
      className={cn(onDark && "text-white hover:bg-white/10 hover:text-white")}
    >
      {next === "ar" ? "العربية" : "EN"}
    </Button>
  );
}
