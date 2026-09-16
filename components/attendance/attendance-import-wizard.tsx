"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Upload, CheckCircle2, XCircle, AlertTriangle, Copy } from "lucide-react";
import { stageAttendanceImportAction, commitAttendanceImportAction, type StagedRow } from "@/actions/attendance-import";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ATTENDANCE_STATUS_LABELS } from "@/types/domain";

const OUTCOME_META: Record<StagedRow["outcome"], { icon: typeof CheckCircle2; color: string; en: string; ar: string }> = {
  matched: { icon: CheckCircle2, color: "text-[#00BCC8]", en: "Matched", ar: "تم التطابق" },
  duplicate: { icon: Copy, color: "text-amber-500", en: "Duplicate in file", ar: "مكرر في الملف" },
  not_enrolled: { icon: AlertTriangle, color: "text-amber-500", en: "Not enrolled", ar: "غير مسجَّل" },
  unrecognized: { icon: XCircle, color: "text-destructive", en: "Missing ID/email", ar: "بدون معرّف/بريد" },
};

export function AttendanceImportWizard({ courseId, sessionId }: { courseId: string; sessionId: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<{ batchId: string; rows: StagedRow[]; summary: Record<string, number> } | null>(null);
  const [committed, setCommitted] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    setError(null);
    if (!file) {
      setError(isAr ? "اختر ملف CSV أو XLSX أولًا." : "Choose a CSV or XLSX file first.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await stageAttendanceImportAction(courseId, sessionId, formData);
      if (result.error || !result.batchId || !result.rows || !result.summary) {
        setError(isAr ? "تعذّرت معالجة الملف." : "Couldn't process that file.");
        return;
      }
      setStaged({ batchId: result.batchId, rows: result.rows, summary: result.summary });
    });
  }

  function handleConfirm() {
    if (!staged) return;
    startTransition(async () => {
      const result = await commitAttendanceImportAction(staged.batchId);
      if (result.error || result.imported === undefined) {
        setError(isAr ? "فشل حفظ الحضور." : "Failed to save attendance.");
        return;
      }
      setCommitted(result.imported);
    });
  }

  if (committed !== null) {
    return (
      <Alert variant="success">
        {isAr
          ? `تم استيراد ${committed} سجل حضور بنجاح.`
          : `Imported ${committed} attendance record${committed === 1 ? "" : "s"} successfully.`}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isAr ? "استيراد من ملف" : "Import from file"}</CardTitle>
        <CardDescription>
          {isAr ? "CSV أو XLSX — أعمدة: Name, Email أو GENHEX ID, Status (اختياري)." : "CSV or XLSX — columns: Name, Email or GENHEX ID, Status (optional)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        {!staged ? (
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="text-sm" />
            <Button size="sm" onClick={handleUpload} disabled={isPending}>
              <Upload className="h-3.5 w-3.5" />
              {isAr ? "معاينة" : "Preview"}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-md bg-muted p-2 text-center">
                <p className="text-lg font-semibold text-[#00BCC8]">{staged.summary.matched}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "متطابق" : "Matched"}</p>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <p className="text-lg font-semibold">{staged.summary.duplicates}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "مكرر" : "Duplicates"}</p>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <p className="text-lg font-semibold">{staged.summary.notEnrolled}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "غير مسجَّل" : "Not enrolled"}</p>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <p className="text-lg font-semibold text-destructive">{staged.summary.invalid}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "غير صالح" : "Invalid"}</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 border-b border-border bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-start">{isAr ? "الصف" : "Row"}</th>
                    <th className="px-3 py-2 text-start">{isAr ? "الحالة" : "Outcome"}</th>
                    <th className="px-3 py-2 text-start">{isAr ? "الحضور" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staged.rows.map((row, i) => {
                    const meta = OUTCOME_META[row.outcome];
                    const Icon = meta.icon;
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">{row.matchedName ?? (row.rawName || row.rawEmail || row.rawGenhexId)}</td>
                        <td className={`flex items-center gap-1 px-3 py-2 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {isAr ? meta.ar : meta.en}
                        </td>
                        <td className="px-3 py-2">{ATTENDANCE_STATUS_LABELS[row.status][isAr ? "ar" : "en"]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirm} disabled={isPending || staged.summary.matched === 0}>
                {isAr ? `تأكيد استيراد ${staged.summary.matched}` : `Confirm import (${staged.summary.matched})`}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStaged(null)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
