"use client";

import { useActionState, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CoverImageField } from "@/components/instructor/cover-image-field";
import { Link } from "@/i18n/navigation";
import type { FormActionState } from "@/actions/courses-admin";
import type { Course } from "@/types/domain";

const ERROR_MESSAGES: Record<string, string> = {
  invalidInput: "Please check the highlighted fields.",
  slugTaken: "That URL slug is already in use — pick another.",
  signInRequired: "Your session expired — please sign in again.",
  generic: "Something went wrong. Please try again.",
};

// A starting-point list, not a hard schema (category is still a free-text
// column) — shows up as <datalist> suggestions so instructors get
// consistent spelling without losing the ability to type something new.
const CATEGORY_SUGGESTIONS = [
  "Artificial Intelligence",
  "Data Science",
  "Web Development",
  "Mobile Development",
  "Cloud & DevOps",
  "Cybersecurity",
  "Business & Product",
  "Design",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border pb-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function CourseForm({
  action,
  course,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  course?: Course;
  submitLabel: string;
  cancelHref?: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [state, formAction, isPending] = useActionState(action, {});
  const [enrollmentMode, setEnrollmentMode] = useState(course?.enrollment_mode ?? "open");
  // Slug auto-follows the English title until the person edits the slug
  // field by hand — after that we stop overwriting their choice. Only
  // relevant for new courses; an existing course's slug is left alone
  // since changing it would break any links already pointing at it.
  const [slugTouched, setSlugTouched] = useState(Boolean(course));
  const [slug, setSlug] = useState(course?.slug ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="locale" value={locale} />

      {state.error && <Alert variant="destructive">{ERROR_MESSAGES[state.error] ?? state.error}</Alert>}

      <div className="flex flex-col gap-4">
        <SectionHeading
          title={isAr ? "الأساسيات" : "Basics"}
          description={isAr ? "العنوان والوصف اللي يشوفه الطلاب." : "The title and description students see."}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title_en">Title (English)</Label>
            <Input
              id="title_en"
              name="title_en"
              defaultValue={course?.title_en}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
            {state.fieldErrors?.title_en && (
              <p className="text-xs text-destructive">{state.fieldErrors.title_en[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title_ar">Title (Arabic)</Label>
            <Input id="title_ar" name="title_ar" dir="rtl" defaultValue={course?.title_ar} required />
            {state.fieldErrors?.title_ar && (
              <p className="text-xs text-destructive">{state.fieldErrors.title_ar[0]}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">URL slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="ai-fundamentals"
            required
          />
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "بيتعبى تلقائيًا من العنوان الإنجليزي — تقدر تعدّله يدويًا."
              : "Filled in automatically from the English title — edit it by hand if you'd like something different."}
          </p>
          {state.fieldErrors?.slug && <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description_en">Description (English)</Label>
            <Textarea id="description_en" name="description_en" defaultValue={course?.description_en ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description_ar">Description (Arabic)</Label>
            <Textarea id="description_ar" name="description_ar" dir="rtl" defaultValue={course?.description_ar ?? ""} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeading title={isAr ? "الصورة" : "Media"} />
        <CoverImageField defaultValue={course?.cover_image_url ?? ""} />
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeading
          title={isAr ? "التصنيف والنشر" : "Classification & publishing"}
          description={
            isAr
              ? "دي بتتحكم فين الدورة بتظهر وإزاي الطلاب يسجّلوا."
              : "Controls where this shows up and how students enroll."
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" list="category-suggestions" defaultValue={course?.category ?? ""} />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="level">Level</Label>
            <Select id="level" name="level" defaultValue={course?.level ?? ""}>
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={course?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enrollment_mode">Enrollment</Label>
            <Select
              id="enrollment_mode"
              name="enrollment_mode"
              value={enrollmentMode}
              onChange={(e) => setEnrollmentMode(e.target.value as "open" | "application")}
            >
              <option value="open">Open</option>
              <option value="application">Application-gated</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exam_requirement">Exam</Label>
            <Select id="exam_requirement" name="exam_requirement" defaultValue={course?.exam_requirement ?? "none"}>
              <option value="none">None</option>
              <option value="optional">Optional</option>
              <option value="required">Required</option>
            </Select>
          </div>
        </div>

        {/* Only shown (and only required) when "Application-gated" is actually
            selected -- most courses are open enrollment and should never need
            to see, let alone fill in, an application form ID. */}
        {enrollmentMode === "application" && (
          <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-3">
            <Label htmlFor="application_form_id">
              {isAr ? "معرّف نموذج التقديم" : "Application form ID"}
            </Label>
            <Input
              id="application_form_id"
              name="application_form_id"
              defaultValue={course?.application_form_id ?? ""}
              placeholder="UUID of an existing forms row"
            />
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "لسه مفيش أداة لإنشاء نماذج التقديم من الواجهة — لو مفيش نموذج جاهز، استخدم التسجيل المفتوح بدلاً من ذلك."
                : "There's no form-builder UI yet — if you don't already have a form, use open enrollment instead."}
            </p>
            {state.fieldErrors?.application_form_id && (
              <p className="text-xs text-destructive">{state.fieldErrors.application_form_id[0]}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? (isAr ? "جارٍ الحفظ…" : "Saving…") : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm text-muted-foreground hover:text-foreground">
            {isAr ? "إلغاء" : "Cancel"}
          </Link>
        )}
      </div>
    </form>
  );
}
