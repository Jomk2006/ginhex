import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLE_HOME_PATH, ROLE_SEGMENT_GUARDS, DEFAULT_LOCALE } from "@/types/domain";

const intlMiddleware = createIntlMiddleware(routing);

const AUTH_PAGES = ["/sign-in", "/sign-up"];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|ar)(\/.*)?$/);
  return match ? (match[2] ?? "/") : pathname;
}

export async function proxy(request: NextRequest) {
  // 1. Locale routing/rewriting first — this establishes the response
  //    next-intl owns (locale cookie, rewritten pathname).
  const intlResponse = intlMiddleware(request);

  // 2. Refresh the Supabase session on top of that response so both
  //    locale and auth cookies land on the same outgoing response.
  const { response, user, role: fetchedRole } = await updateSession(request, intlResponse);

  const pathWithoutLocale = stripLocale(request.nextUrl.pathname);
  const isAppRoute = pathWithoutLocale.startsWith("/app");
  const isAuthPage = AUTH_PAGES.some((p) => pathWithoutLocale.startsWith(p));

  const localeMatch = request.nextUrl.pathname.match(/^\/(en|ar)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : DEFAULT_LOCALE;

  // 3. Auth gate — protected /app/* requires a signed-in user.
  if (isAppRoute && !user) {
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user) {
    const role = fetchedRole ?? "student";

    // 4. Signed-in users hitting sign-in/sign-up land on their dashboard.
    if (isAuthPage) {
      return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME_PATH[role]}`, request.url));
    }

    // 5. Bare /app → redirect to the role's home dashboard.
    if (pathWithoutLocale === "/app" || pathWithoutLocale === "/app/") {
      return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME_PATH[role]}`, request.url));
    }

    // 6. Role-segment guard — a student can't load /app/instructor/*, etc.
    //    NOTE (per schema design): this is UX-level routing only. Every
    //    underlying table still enforces the real boundary via RLS, so
    //    this check being bypassed somehow would not leak data.
    for (const guard of ROLE_SEGMENT_GUARDS) {
      if (pathWithoutLocale.startsWith(guard.prefix) && role !== guard.role) {
        return NextResponse.redirect(new URL(`/${locale}${ROLE_HOME_PATH[role]}`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets, images, and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
