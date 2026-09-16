"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { YouTubePlayer } from "@/components/learn/youtube-player";
import { GoogleDrivePlayer } from "@/components/learn/google-drive-player";
import { MaterialsList, type ResolvedResource } from "@/components/learn/materials-list";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { updateLessonProgressAction } from "@/actions/progress";
import { LESSON_COMPLETION_THRESHOLD } from "@/types/domain";
import type { VideoSource } from "@/types/domain";

interface PlayerLesson {
  id: string;
  title_en: string;
  title_ar: string;
  video_source: VideoSource;
  youtube_video_id: string | null;
  drive_url: string | null;
  duration_seconds: number;
  watchedSeconds: number;
  isCompleted: boolean;
}

interface PlayerModule {
  id: string;
  title_en: string;
  title_ar: string;
  lessons: PlayerLesson[];
}

export function CoursePlayer({
  enrollmentId,
  courseSlug,
  modules,
  initialLessonId,
  materialsByLessonId,
}: {
  enrollmentId: string;
  courseSlug: string;
  modules: PlayerModule[];
  initialLessonId: string;
  materialsByLessonId: Record<string, ResolvedResource[]>;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [, startTransition] = useTransition();

  const flatLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId);
  const [progressState, setProgressState] = useState<Record<string, { watchedSeconds: number; isCompleted: boolean }>>(
    () =>
      Object.fromEntries(
        flatLessons.map((l) => [l.id, { watchedSeconds: l.watchedSeconds, isCompleted: l.isCompleted }])
      )
  );

  const activeLesson = flatLessons.find((l) => l.id === activeLessonId) ?? flatLessons[0];
  const activeIndex = flatLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;

  const completedCount = Object.values(progressState).filter((p) => p.isCompleted).length;
  const coursePercent = flatLessons.length > 0 ? Math.round((completedCount / flatLessons.length) * 100) : 0;

  function reportProgress(lessonId: string, seconds: number) {
    setProgressState((prev) => ({
      ...prev,
      [lessonId]: {
        watchedSeconds: Math.max(prev[lessonId]?.watchedSeconds ?? 0, seconds),
        isCompleted: prev[lessonId]?.isCompleted || false,
      },
    }));

    startTransition(async () => {
      const result = await updateLessonProgressAction(enrollmentId, lessonId, seconds, {
        locale,
        courseSlug,
      });
      if (result.ok) {
        setProgressState((prev) => ({
          ...prev,
          [lessonId]: {
            watchedSeconds: Math.max(prev[lessonId]?.watchedSeconds ?? 0, seconds),
            isCompleted: result.isCompleted ?? prev[lessonId]?.isCompleted ?? false,
          },
        }));
      }
    });
  }

  if (!activeLesson) {
    return <p className="text-muted-foreground">{isAr ? "لا توجد دروس بعد." : "No lessons yet."}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div className="flex flex-col gap-4 lg:col-span-3">
        {activeLesson.video_source === "google_drive" && activeLesson.drive_url ? (
          <>
            <GoogleDrivePlayer key={activeLesson.id} url={activeLesson.drive_url} />
            {!progressState[activeLesson.id]?.isCompleted && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => reportProgress(activeLesson.id, activeLesson.duration_seconds)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? "تحديد كمكتمل" : "Mark as complete"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "فيديوهات Google Drive لا يمكن تتبّع وقت مشاهدتها تلقائيًا — حدّد الدرس كمكتمل يدويًا بعد المشاهدة."
                : "Google Drive videos can't auto-track watch time — mark the lesson complete manually once you've watched it."}
            </p>
          </>
        ) : (
          <YouTubePlayer
            key={activeLesson.id}
            youtubeVideoId={activeLesson.youtube_video_id ?? ""}
            onProgress={(seconds) => reportProgress(activeLesson.id, seconds)}
          />
        )}

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{isAr ? activeLesson.title_ar : activeLesson.title_en}</h1>
          <p className="text-sm text-muted-foreground">
            {progressState[activeLesson.id]?.isCompleted
              ? isAr
                ? "مكتمل"
                : "Completed"
              : isAr
                ? `شوهد ${Math.round(
                    (progressState[activeLesson.id]?.watchedSeconds ?? 0) / Math.max(activeLesson.duration_seconds, 1) * 100
                  )}% (يكتمل عند ${Math.round(LESSON_COMPLETION_THRESHOLD * 100)}%)`
                : `${Math.round(
                    ((progressState[activeLesson.id]?.watchedSeconds ?? 0) / Math.max(activeLesson.duration_seconds, 1)) * 100
                  )}% watched (completes at ${Math.round(LESSON_COMPLETION_THRESHOLD * 100)}%)`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prevLesson}
            onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
          >
            {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {isAr ? "السابق" : "Previous"}
          </Button>
          <Button disabled={!nextLesson} onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}>
            {isAr ? "التالي" : "Next"}
            {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <MaterialsList key={`materials-${activeLesson.id}`} resources={materialsByLessonId[activeLesson.id] ?? []} />
      </div>

      <div className="flex flex-col gap-4 lg:col-span-1">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isAr ? "تقدّم الدورة" : "Course progress"}</span>
            <span className="font-medium">{coursePercent}%</span>
          </div>
          <Progress value={coursePercent} />
        </div>
        <LessonSidebar
          modules={modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) => ({
              ...l,
              isCompleted: progressState[l.id]?.isCompleted ?? false,
            })),
          }))}
          activeLessonId={activeLesson.id}
          onSelect={setActiveLessonId}
        />
      </div>
    </div>
  );
}
