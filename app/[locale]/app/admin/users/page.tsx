import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles } from "@/lib/data/admin";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage({
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

  const profiles = await getAllProfiles();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{isAr ? "إدارة المستخدمين" : "User management"}</h1>
      <p className="text-sm text-muted-foreground">
        {isAr ? `${profiles.length} مستخدم على المنصة` : `${profiles.length} users on the platform`}
      </p>
      <UsersTable profiles={profiles} currentUserId={user.id} />
    </div>
  );
}
