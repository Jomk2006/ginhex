import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shared/app-shell";
import { THEME_COOKIE, DEFAULT_THEME } from "@/lib/theme";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensive — middleware already gates unauthenticated access to /app/*.
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;

  const role = profile?.role ?? "student";
  const displayName = (locale === "ar" ? profile?.full_name_ar : profile?.full_name_en) ?? user.email ?? "";

  return (
    <AppShell
      role={role}
      displayName={displayName}
      email={user.email ?? ""}
      genhexId={profile?.genhex_id ?? ""}
      avatarUrl={profile?.avatar_url ?? null}
      theme={theme}
    >
      {children}
    </AppShell>
  );
}
