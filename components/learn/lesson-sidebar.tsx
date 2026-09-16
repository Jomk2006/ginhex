"use client";

import { useLocale } from "next-intl";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLesson {
  id: string;
  title_en: string;
  title_ar: string;
  isCompleted: boolean;
}

interface SidebarModule {
  id: string;
  title_en: string;
  title_ar: string;
  lessons: SidebarLesson[];
}

export function LessonSidebar({
  modules,
  activeLessonId,
  onSelect,
}: {
  modules: SidebarModule[];
  activeLessonId: string;
  onSelect: (lessonId: string) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <nav className="flex flex-col gap-4">
      {modules.map((module) => (
        <div key={module.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isAr ? module.title_ar : module.title_en}
          </p>
          <ul className="flex flex-col gap-1">
            {module.lessons.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lesson.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm transition-colors",
                      isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isActive ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                    ) : lesson.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="line-clamp-1">{isAr ? lesson.title_ar : lesson.title_en}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
