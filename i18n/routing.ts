import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/types/domain";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always", // /en/... and /ar/... always explicit — no ambiguous default
});
