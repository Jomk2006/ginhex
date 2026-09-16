import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, DEFAULT_THEME } from "@/lib/theme";
import "../globals.css";

export const metadata: Metadata = {
  title: "GENHEX — Build What's Next.",
  description: "GENHEX is a bilingual platform for learning the technologies that turn ideas into systems.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${theme === "dark" ? "dark" : ""} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
