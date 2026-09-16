"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { FileText, Link2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createLinkResourceAction, recordUploadedResourceAction, deleteResourceAction } from "@/actions/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const MAX_FILE_SIZE_MB = 25;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"];

interface ExistingResource {
  id: string;
  title_en: string;
  title_ar: string;
  type: string;
  file_url: string | null;
  external_url: string | null;
}

export function MaterialsManager({
  courseId,
  lessonId,
  existing,
}: {
  courseId: string;
  lessonId: string;
  existing: ExistingResource[];
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"file" | "link">("file");

  function handleFileUpload(formData: FormData) {
    const file = fileInputRef.current?.files?.[0];
    setError(null);

    if (!file) {
      setError(isAr ? "اختر ملفًا أولًا." : "Choose a file first.");
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(isAr ? "نوع الملف غير مدعوم." : "That file type isn't supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(isAr ? `الحد الأقصى ${MAX_FILE_SIZE_MB} ميجا.` : `Max file size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = `${courseId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("course-materials").upload(path, file);
      if (uploadError) {
        setError(isAr ? "فشل رفع الملف." : "File upload failed.");
        return;
      }

      const recordData = new FormData();
      recordData.set("title_en", String(formData.get("title_en") ?? file.name));
      recordData.set("title_ar", String(formData.get("title_ar") ?? file.name));
      recordData.set("storagePath", path);

      const result = await recordUploadedResourceAction(courseId, lessonId, recordData);
      if (result.error) {
        setError(isAr ? "تم رفع الملف لكن حدث خطأ في الحفظ." : "File uploaded but saving the record failed.");
        return;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleLinkSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLinkResourceAction(courseId, lessonId, formData);
      if (result.error) {
        setError(isAr ? "تعذّر إضافة الرابط." : "Couldn't add the link.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border p-4">
      <p className="text-sm font-medium">{isAr ? "المواد التعليمية" : "Materials"}</p>

      {existing.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {existing.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                {r.type === "link" ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {isAr ? r.title_ar : r.title_en}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteResourceAction(r.id, r.file_url)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={mode === "file" ? "font-medium text-foreground" : "text-muted-foreground"}
        >
          {isAr ? "رفع ملف" : "Upload file"}
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={mode === "link" ? "font-medium text-foreground" : "text-muted-foreground"}
        >
          {isAr ? "إضافة رابط" : "Add link"}
        </button>
      </div>

      {mode === "file" ? (
        <form action={handleFileUpload} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input name="title_en" placeholder={isAr ? "العنوان (إنجليزي)" : "Title (English)"} className="text-xs" />
          <Input name="title_ar" placeholder={isAr ? "العنوان (عربي)" : "Title (Arabic)"} dir="rtl" className="text-xs" />
          <div className="flex gap-2">
            <Input ref={fileInputRef} type="file" accept={ALLOWED_EXTENSIONS.join(",")} className="text-xs" />
          </div>
          <Button type="submit" size="sm" disabled={isPending} className="w-fit sm:col-span-3">
            <Upload className="h-3.5 w-3.5" />
            {isAr ? "رفع" : "Upload"}
          </Button>
        </form>
      ) : (
        <form action={handleLinkSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input name="title_en" placeholder={isAr ? "العنوان (إنجليزي)" : "Title (English)"} required className="text-xs" />
          <Input name="title_ar" placeholder={isAr ? "العنوان (عربي)" : "Title (Arabic)"} dir="rtl" required className="text-xs" />
          <Input name="external_url" type="url" placeholder="https://..." required className="text-xs" />
          <Button type="submit" size="sm" disabled={isPending} className="w-fit sm:col-span-3">
            <Link2 className="h-3.5 w-3.5" />
            {isAr ? "إضافة" : "Add"}
          </Button>
        </form>
      )}

      <p className="text-xs text-muted-foreground">
        {isAr
          ? `PDF, DOC, PPT, XLS, ZIP — حتى ${MAX_FILE_SIZE_MB} ميجا`
          : `PDF, DOC, PPT, XLS, ZIP — up to ${MAX_FILE_SIZE_MB}MB`}
      </p>
    </div>
  );
}
