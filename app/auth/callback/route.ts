import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME_PATH } from "@/types/domain";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/types/domain";

// Handles the redirect back from both Google OAuth and Supabase email
// links (password reset, sign-up confirmation) — both use the PKCE
// `code` exchange flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const localeParam = searchParams.get("locale");
  const locale: Locale = LOCALES.includes(localeParam as Locale) ? (localeParam as Locale) : DEFAULT_LOCALE;

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/${locale}/sign-in?error=auth_callback_failed`);
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Read the role from profiles.role (RLS's own source of truth) rather
  // than a JWT custom claim — that claim needs a Supabase Auth Hook this
  // project never configured, so it was always empty and every OAuth/
  // email-link sign-in landed on the student dashboard regardless of
  // the account's real role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.session.user.id)
    .maybeSingle();
  const role = profile?.role ?? "student";
  return NextResponse.redirect(`${origin}/${locale}${ROLE_HOME_PATH[role]}`);
}
