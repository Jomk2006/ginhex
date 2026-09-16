import { getLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentAttendancePercent, getStudentAttendanceBreakdown } from "@/lib/data/attendance";

export async function StudentAttendanceCard({
  studentId,
  courseId,
  courseTitleEn,
  courseTitleAr,
}: {
  studentId: string;
  courseId: string;
  courseTitleEn: string;
  courseTitleAr: string;
}) {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const [percent, breakdown] = await Promise.all([
    getStudentAttendancePercent(studentId, courseId),
    getStudentAttendanceBreakdown(studentId, courseId),
  ]);

  if (breakdown.totalSessions === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isAr ? courseTitleAr : courseTitleEn}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isAr ? "نسبة الحضور" : "Attendance"}</span>
            <span className="font-semibold">{percent ?? 0}%</span>
          </div>
          <Progress value={percent ?? 0} />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <p className="text-lg font-semibold">{breakdown.present}</p>
            <p className="text-muted-foreground">{isAr ? "حاضر" : "Present"}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{breakdown.absent}</p>
            <p className="text-muted-foreground">{isAr ? "غائب" : "Absent"}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{breakdown.late}</p>
            <p className="text-muted-foreground">{isAr ? "متأخر" : "Late"}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{breakdown.excused}</p>
            <p className="text-muted-foreground">{isAr ? "معذور" : "Excused"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
