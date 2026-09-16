import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/shared/profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage({
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
  if (!profile) redirect(`/${locale}/sign-in`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{isAr ? "الملف الشخصي" : "Profile"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "بيانات حسابك الأساسية." : "Your account's basic information."}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{isAr ? "معلومات الحساب" : "Account info"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant="outline">{profile.role}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{isAr ? "معرّف GENHEX" : "GENHEX ID"}</dt>
              <dd className="font-mono font-medium">{profile.genhex_id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{isAr ? "الحالة" : "Status"}</dt>
              <dd className="font-medium">
                {profile.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطّل" : "Deactivated")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{isAr ? "تاريخ الانضمام" : "Joined"}</dt>
              <dd className="font-medium">
                {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
              </dd>
            </div>
          </dl>
          <ProfileForm profile={profile} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
