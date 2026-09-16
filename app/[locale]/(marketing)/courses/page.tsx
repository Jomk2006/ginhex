import { getLocale } from "next-intl/server";
import { getPublishedCourses, getCourseCategories } from "@/lib/data/courses";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFilters } from "@/components/courses/course-filters";
import type { CourseLevel } from "@/types/domain";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; level?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const [courses, categories] = await Promise.all([
    getPublishedCourses({
      search: params.search,
      category: params.category,
      level: params.level as CourseLevel | undefined,
    }),
    getCourseCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{isAr ? "الدورات" : "Courses"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "تعلّم التقنيات التي تحوّل الأفكار إلى أنظمة." : "Learn the technologies that turn ideas into systems."}
        </p>
      </div>

      <div className="mb-8">
        <CourseFilters categories={categories} />
      </div>

      {courses.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          {isAr ? "لا توجد دورات مطابقة." : "No courses match your filters."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
