import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import type { Course, CourseLevel } from "@/types/domain";
import { COURSE_LEVEL_LABELS } from "@/types/domain";

type CourseCardData = Pick<
  Course,
  "slug" | "title_en" | "title_ar" | "description_en" | "description_ar" | "cover_image_url" | "category" | "level" | "enrollment_mode"
>;

export async function CourseCard({ course }: { course: CourseCardData }) {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const title = isAr ? course.title_ar : course.title_en;
  const description = isAr ? course.description_ar : course.description_en;

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full bg-muted">
          <CourseThumbnail src={course.cover_image_url} alt={title} />
        </div>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {course.category && <Badge variant="muted">{course.category}</Badge>}
            {course.level && (
              <Badge variant="outline">{COURSE_LEVEL_LABELS[course.level as CourseLevel][isAr ? "ar" : "en"]}</Badge>
            )}
            {course.enrollment_mode === "application" && (
              <Badge variant="accent">{isAr ? "بالتقديم" : "By application"}</Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
        </CardHeader>
        {description && (
          <CardContent className="pt-0">
            <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
