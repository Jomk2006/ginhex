"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CoverImageField({ defaultValue }: { defaultValue?: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(isAr ? "الصور المسموحة: JPG, PNG, WEBP فقط." : "Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(isAr ? `الحجم الأقصى ${MAX_SIZE_MB} ميجا.` : `Max size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(isAr ? "انتهت الجلسة." : "Session expired.");
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("course-thumbnails").upload(path, file, {
        upsert: false,
      });
      if (uploadError) {
        setError(isAr ? "فشل رفع الصورة." : "Image upload failed.");
        return;
      }

      const { data: publicUrl } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
      setUrl(publicUrl.publicUrl);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{isAr ? "صورة الغلاف" : "Cover image"}</Label>
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex items-start gap-4">
        <div className="relative flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted">
          {url ? (
            <>
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setUrl("")}
                className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white"
                aria-label={isAr ? "إزالة الصورة" : "Remove image"}
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" size="sm" onClick={handlePickFile} disabled={isPending} className="w-fit">
            {isPending ? (isAr ? "جارٍ الرفع..." : "Uploading...") : isAr ? "رفع صورة" : "Upload image"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أو الصق رابط صورة مباشرة:" : "or paste an image URL directly:"}
          </p>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="text-xs"
          />
        </div>
      </div>

      {/* This is the field the Server Action actually reads. */}
      <input type="hidden" name="cover_image_url" value={url} />
    </div>
  );
}
