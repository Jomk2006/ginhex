import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteCourseButton } from "@/components/instructor/delete-course-button";
import type { Course } from "@/types/domain";

const STATUS_VARIANT: Record<Course["status"], "default" | "outline" | "muted"> = {
  published: "default",
  draft: "outline",
  archived: "muted",
};

export function InstructorCourseCard({
  course,
  adminHref,
}: {
  course: Course;
  adminHref?: string;
}) {
  const editBase: "app/instructor" | "app/admin" = adminHref ? "app/admin" : "app/instructor";

  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      {/* Full-card click target for navigating to edit — the delete
          form below sits at a higher z-index so it stays independently
          clickable instead of triggering this navigation. */}
      <Link
        href={adminHref ?? `/app/instructor/courses/${course.id}/edit`}
        className="absolute inset-0"
        aria-label={course.title_en}
      >
        <span className="sr-only">{course.title_en}</span>
      </Link>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <CardTitle className="text-lg">{course.title_en}</CardTitle>
        <Badge variant={STATUS_VARIANT[course.status]}>{course.status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span>{course.title_ar}</span>
        <span>
          {course.enrollment_mode === "open" ? "Open enrollment" : "Application-gated"} · Exam:{" "}
          {course.exam_requirement}
        </span>
      </CardContent>
      <DeleteCourseButton
        courseId={course.id}
        courseTitle={course.title_en}
        editBase={editBase}
        className="relative z-10 border-t border-border px-4 py-2"
      />
    </Card>
  );
}
