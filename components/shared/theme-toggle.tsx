"use client";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ current, onDark }: { current: Theme; onDark?: boolean }) {
  const router = useRouter();

  function toggle() {
    const next: Theme = current === "dark" ? "light" : "dark";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(onDark && "text-white hover:bg-white/10 hover:text-white")}
    >
      {current === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
