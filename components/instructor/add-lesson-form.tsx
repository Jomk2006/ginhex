"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { createLessonAction, type FormActionState } from "@/actions/courses-admin";

const ERROR_MESSAGES: Record<string, string> = {
  invalidInput: "Please check the highlighted fields.",
  generic: "Something went wrong saving this lesson — see server logs for the exact database error.",
};

export function AddLessonForm({ moduleId, nextOrder }: { moduleId: string; nextOrder: number }) {
  const boundAction = createLessonAction.bind(null, moduleId);
  const [state, formAction, isPending] = useActionState<FormActionState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <Alert variant="destructive">{ERROR_MESSAGES[state.error] ?? state.error}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-title-en-${moduleId}`}>Title (English)</Label>
        <Input id={`lesson-title-en-${moduleId}`} name="title_en" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-title-ar-${moduleId}`}>Title (Arabic)</Label>
        <Input id={`lesson-title-ar-${moduleId}`} name="title_ar" dir="rtl" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-source-${moduleId}`}>Video source</Label>
        <Select id={`lesson-source-${moduleId}`} name="video_source" defaultValue="youtube">
          <option value="youtube">YouTube</option>
          <option value="google_drive">Google Drive</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-duration-${moduleId}`}>Duration (seconds)</Label>
        <Input id={`lesson-duration-${moduleId}`} name="duration_seconds" type="number" min={1} required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-yt-${moduleId}`}>YouTube video ID (if YouTube)</Label>
        <Input id={`lesson-yt-${moduleId}`} name="youtube_video_id" placeholder="dQw4w9WgXcQ" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-drive-${moduleId}`}>Google Drive link (if Drive)</Label>
        <Input id={`lesson-drive-${moduleId}`} name="drive_url" placeholder="https://drive.google.com/file/d/.../view" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`lesson-order-${moduleId}`}>Order</Label>
        <Input
          id={`lesson-order-${moduleId}`}
          name="order_index"
          type="number"
          min={0}
          defaultValue={nextOrder}
          required
        />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="is_preview" className="h-4 w-4" />
        Free preview
      </label>
      <Button type="submit" size="sm" disabled={isPending} className="w-fit sm:col-span-2">
        {isPending ? "Adding…" : "Add lesson"}
      </Button>
    </form>
  );
}
