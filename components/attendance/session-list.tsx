"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createSessionAction, type AttendanceActionState } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceSession } from "@/types/domain";

const initialState: AttendanceActionState = {};

export function SessionList({
  courseId,
  sessions,
  attendanceBasePath,
}: {
  courseId: string;
  sessions: AttendanceSession[];
  /** e.g. "/app/instructor/attendance" or "/app/admin/attendance" */
  attendanceBasePath: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const boundAction = createSessionAction.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "جلسة جديدة" : "New session"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {state.error && (
              <Alert variant="destructive" className="sm:col-span-4">
                {isAr ? "تحقّق من البيانات المدخلة." : "Please check the fields and try again."}
              </Alert>
            )}
            <div className="flex flex-col gap-1">
              <Label htmlFor="title">{isAr ? "عنوان الجلسة" : "Session title"}</Label>
              <Input id="title" name="title" placeholder={isAr ? "محاضرة 3" : "Lecture 03"} required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="session_date">{isAr ? "التاريخ" : "Date"}</Label>
              <Input id="session_date" name="session_date" type="date" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="mode">{isAr ? "النوع" : "Mode"}</Label>
              <Select id="mode" name="mode" defaultValue="onsite">
                <option value="onsite">{isAr ? "حضوري" : "Onsite"}</option>
                <option value="online">{isAr ? "أونلاين" : "Online"}</option>
              </Select>
            </div>
            <Button type="submit" disabled={isPending} className="self-end">
              {isAr ? "إنشاء" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{isAr ? "لا توجد جلسات بعد." : "No sessions yet."}</p>
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              href={`${attendanceBasePath}/${courseId}/${session.id}`}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:border-[#00BCC8]/40"
            >
              <span className="font-medium">{session.title}</span>
              <span className="text-muted-foreground">
                {new Date(session.session_date).toLocaleDateString(isAr ? "ar-EG" : "en-US")} ·{" "}
                {session.mode === "online" ? (isAr ? "أونلاين" : "Online") : isAr ? "حضوري" : "Onsite"}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
