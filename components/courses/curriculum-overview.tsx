import { getLocale } from "next-intl/server";
import { PlayCircle, Lock } from "lucide-react";

interface CurriculumLesson {
  id: string;
  title_en: string;
  title_ar: string;
  duration_seconds: number;
  order_index: number;
  is_preview: boolean;
}

interface CurriculumModule {
  id: string;
  title_en: string;
  title_ar: string;
  order_index: number;
  lessons: CurriculumLesson[];
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export async function CurriculumOverview({
  modules,
  isEnrolled,
}: {
  modules: CurriculumModule[];
  isEnrolled: boolean;
}) {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">
        {isAr ? "محتوى الدورة" : "Course content"}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({totalLessons} {isAr ? "درس" : "lessons"})
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {modules.map((module) => (
          <div key={module.id} className="rounded-lg border border-border">
            <div className="border-b border-border bg-muted px-4 py-3 font-medium">
              {isAr ? module.title_ar : module.title_en}
            </div>
            <ul className="divide-y divide-border">
              {module.lessons.map((lesson) => {
                const canPreview = lesson.is_preview || isEnrolled;
                return (
                  <li key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      {canPreview ? (
                        <PlayCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isAr ? lesson.title_ar : lesson.title_en}
                    </span>
                    <span className="text-muted-foreground">{formatDuration(lesson.duration_seconds)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
