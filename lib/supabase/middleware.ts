import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { serverEnv } from "@/lib/env";

type UserRole = Database["public"]["Enums"]["user_role"];

/**
 * Refreshes the Supabase auth session on every matched request and
 * mirrors the refreshed cookies onto the outgoing response. Must run
 * in proxy.ts — Server Components alone cannot write cookies.
 *
 * Returns the response (with refreshed cookies), the authenticated
 * user, the session, and the user's role — read from profiles.role,
 * not from a JWT custom claim. A claims-in-JWT approach needs a
 * Supabase "Customize Access Token" Auth Hook configured in the
 * project dashboard; this project never had one, so that claim was
 * always empty and every signed-in user routed as "student". Reading
 * profiles.role directly has no such external dependency — it's the
 * same table RLS already trusts as the source of truth.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession()) — it revalidates the token
  // against Supabase Auth rather than trusting an unverified cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let role: UserRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  return { response, user, session, role };
}
