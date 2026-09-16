"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { ROLE_HOME_PATH, ROLE_LABELS } from "@/types/domain";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  displayName: string;
  email: string;
  role: UserRole;
  genhexId: string;
  avatarUrl: string | null;
  /** Set true when rendered over a forced-dark surface (e.g. the marketing hero) so text stays readable before the nav's scrolled/glass state kicks in. */
  onDark?: boolean;
}

export function AccountMenu({ displayName, email, role, genhexId, avatarUrl, onDark }: AccountMenuProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const dashboardPath = ROLE_HOME_PATH[role];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full py-1 pe-2 ps-1 text-sm transition-colors",
          onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- small avatar from a user-supplied URL, not worth Next/Image's remote-pattern config for this
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00BCC8] text-sm font-semibold text-[#0A0A0A]">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[10rem] truncate font-medium sm:inline">{displayName}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute end-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lg"
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{genhexId}</p>
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {ROLE_LABELS[role][isAr ? "ar" : "en"]}
            </span>
          </div>
          <nav className="flex flex-col py-1">
            <Link
              href="/app/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
            >
              <User className="h-4 w-4" />
              {isAr ? "الملف الشخصي" : "Profile"}
            </Link>
            <Link
              href={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              {isAr ? "لوحة التحكم" : "Dashboard"}
            </Link>
          </nav>
          <form action={signOutAction} className="border-t border-border py-1">
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
