"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";
import type { UserRole } from "@/types/domain";

interface AccountInfo {
  displayName: string;
  email: string;
  role: UserRole;
  genhexId: string;
  avatarUrl: string | null;
}

export function MarketingNav({ theme, account }: { theme: Theme; account: AccountInfo | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on route change (otherwise it stays open after
  // tapping a link, since this component doesn't unmount on navigation).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Only the homepage has a forced-dark hero directly beneath the nav —
  // every other marketing page (courses, course detail, apply) uses the
  // normal theme-aware background, so the nav must stay theme-aware there
  // even before scrolling, or its text would render invisible.
  const isHomepage = pathname === "/";
  const onDarkHero = isHomepage && !scrolled;

  const navLinkClass = cn(
    "text-xs font-medium uppercase tracking-widest transition-colors",
    onDarkHero ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
  );

  const navLinks = [
    { href: "/courses", label: isAr ? "الدورات" : "Courses" },
    { href: "/about", label: isAr ? "من نحن" : "About" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile menu button — previously missing entirely, so
                Courses/About (hidden below sm since the inline nav is
                `hidden sm:flex`) had no way to be reached on mobile. */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={isAr ? "افتح القائمة" : "Open menu"}
              aria-expanded={mobileOpen}
              className={cn(
                "-ms-1.5 flex h-9 w-9 items-center justify-center rounded-md transition-colors sm:hidden",
                onDarkHero ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/">
              <Logo height={60} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <nav className="me-2 hidden items-center gap-6 sm:flex">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <LocaleSwitcher onDark={onDarkHero} />
            <ThemeToggle current={theme} onDark={onDarkHero} />
            {account ? (
              <AccountMenu
                displayName={account.displayName}
                email={account.email}
                role={account.role}
                genhexId={account.genhexId}
                avatarUrl={account.avatarUrl}
                onDark={onDarkHero}
              />
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className={cn(onDarkHero && "border-white/40 text-white hover:bg-white/10 hover:text-white")}
              >
                <Link href="/sign-in">{isAr ? "تسجيل الدخول" : "Sign in"}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-3">
              <Logo height={44} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={isAr ? "أغلق القائمة" : "Close menu"}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-[#00B6BF]/10 text-[#00B6BF]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {!account && (
              <div className="mt-auto border-t border-border p-3">
                <Button asChild size="sm" className="w-full">
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                    {isAr ? "تسجيل الدخول" : "Sign in"}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
