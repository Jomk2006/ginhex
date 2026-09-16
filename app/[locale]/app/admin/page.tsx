import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/data/admin";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const stats = await getPlatformStats();
  const name = isAr ? profile?.full_name_ar : profile?.full_name_en;

  const cards = [
    { label: isAr ? "إجمالي الطلاب" : "Total students", value: stats.totalStudents },
    { label: isAr ? "إجمالي المدرّبين" : "Total instructors", value: stats.totalInstructors },
    { label: isAr ? "إجمالي الدورات" : "Total courses", value: stats.totalCourses },
    { label: isAr ? "الدورات المنشورة" : "Published courses", value: stats.publishedCourses },
    { label: isAr ? "إجمالي التسجيلات" : "Total enrollments", value: stats.totalEnrollments },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{isAr ? `مرحبًا، ${name ?? user.email}` : `Welcome, ${name ?? user.email}`}</h1>
        <p className="text-muted-foreground">
          {isAr ? "لوحة تحكم إدارة منصة GENHEX." : "GENHEX platform administration."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="sm">
          <Link href="/app/admin/courses/new">{isAr ? "إنشاء دورة" : "Create course"}</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/admin/courses">{isAr ? "إدارة الدورات" : "Manage courses"}</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/admin/users">{isAr ? "إدارة المستخدمين" : "Manage users"}</Link>
        </Button>
      </div>
    </div>
  );
}
