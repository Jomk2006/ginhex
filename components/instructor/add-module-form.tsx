"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { createModuleAction, type FormActionState } from "@/actions/courses-admin";

const ERROR_MESSAGES: Record<string, string> = {
  invalidInput: "Please check the highlighted fields.",
  generic: "Something went wrong saving this module — see server logs for the exact database error.",
};

export function AddModuleForm({ courseId, nextOrder }: { courseId: string; nextOrder: number }) {
  const boundAction = createModuleAction.bind(null, courseId);
  const [state, formAction, isPending] = useActionState<FormActionState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {state.error && (
        <div className="sm:col-span-3">
          <Alert variant="destructive">{ERROR_MESSAGES[state.error] ?? state.error}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="module-title-en">Title (English)</Label>
        <Input id="module-title-en" name="title_en" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="module-title-ar">Title (Arabic)</Label>
        <Input id="module-title-ar" name="title_ar" dir="rtl" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="module-order">Order</Label>
        <Input id="module-order" name="order_index" type="number" min={0} defaultValue={nextOrder} required />
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="w-fit sm:col-span-3">
        {isPending ? "Adding…" : "Add module"}
      </Button>
    </form>
  );
}
