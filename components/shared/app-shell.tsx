"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { cn } from "@/lib/utils";
import { getAppNavItems, type NavItem } from "@/lib/nav-items";
import type { Theme } from "@/lib/theme";
import type { UserRole } from "@/types/domain";
import { ROLE_HOME_PATH } from "@/types/domain";

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const isDashboardRoot =
          item.href === "/app/student" || item.href === "/app/instructor" || item.href === "/app/admin";
        const isActive = isDashboardRoot ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-[#00B6BF]/10 text-[#00B6BF]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {isAr ? item.labelAr : item.labelEn}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  displayName,
  email,
  genhexId,
  avatarUrl,
  theme,
  children,
}: {
  role: UserRole;
  displayName: string;
  email: string;
  genhexId: string;
  avatarUrl: string | null;
  theme: Theme;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Computed here (client-side) from the plain role string, not received
  // as a prop -- NavItem.icon holds actual component references, and
  // function/component values can't be passed from a Server Component
  // into a Client Component's props. That was the real bug: the layout
  // (a Server Component) was calling getAppNavItems() and passing the
  // result in as a prop, which crashed at runtime on every /app/* page.
  const navItems = getAppNavItems(role);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href={ROLE_HOME_PATH[role]}>
              <Logo height={60} />
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle current={theme} />
            <AccountMenu displayName={displayName} email={email} role={role} genhexId={genhexId} avatarUrl={avatarUrl} />
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Permanent sidebar on sm+ (laptop/tablet/desktop) */}
        <aside className="sticky top-0 hidden h-[calc(100vh-73px)] w-56 shrink-0 self-start overflow-y-auto border-e border-border sm:block">
          <NavLinks items={navItems} />
        </aside>

        {/* Mobile overlay drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
            <div className="absolute inset-y-0 start-0 w-64 bg-background shadow-xl">
              <div className="flex items-center justify-between border-b border-border p-3">
                <Logo height={40} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks items={navItems} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
