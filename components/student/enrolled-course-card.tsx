import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface EnrolledCourseCardProps {
  courseSlug: string;
  titleEn: string;
  titleAr: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

export async function EnrolledCourseCard({
  courseSlug,
  titleEn,
  titleAr,
  progressPercent,
  completedLessons,
  totalLessons,
}: EnrolledCourseCardProps) {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isAr ? titleAr : titleEn}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={progressPercent} />
        <p className="text-sm text-muted-foreground">
          {completedLessons}/{totalLessons} {isAr ? "دروس مكتملة" : "lessons complete"} · {progressPercent}%
        </p>
        <Button asChild size="sm" className="w-fit">
          <Link href={`/app/student/courses/${courseSlug}/learn`}>
            {progressPercent >= 100 ? (isAr ? "مراجعة" : "Review") : isAr ? "متابعة التعلّم" : "Continue learning"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
