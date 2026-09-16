import { cookies } from "next/headers";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { THEME_COOKIE, DEFAULT_THEME } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single()).data
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav
        theme={theme}
        account={
          user && profile
            ? {
                displayName: locale === "ar" ? profile.full_name_ar : profile.full_name_en,
                email: user.email ?? "",
                role: profile.role,
                genhexId: profile.genhex_id,
                avatarUrl: profile.avatar_url,
              }
            : null
        }
      />
      {/* pt-24 keeps normal-page content clear of the now-fixed nav; the
          homepage hero cancels it with -mt-24 so its dark background
          bleeds up behind the nav (see hero-section.tsx). Matches the
          nav's actual height (60px logo + py-3 padding ≈ 84px). */}
      <main className="flex-1 pt-24">{children}</main>
      <MarketingFooter />
    </div>
  );
}
