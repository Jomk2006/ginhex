import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { serverEnv } from "@/lib/env";

// Session-scoped client for Server Components, Route Handlers, and
// Server Actions. RLS applies using the request's cookies — this is
// the client nearly all app code should use for reads and writes.
//
// NOTE: cookies() is async in the App Router — every caller must await.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (not a Server Action/Route
            // Handler) — cookies() is read-only there. Safe to ignore
            // as long as middleware.ts is refreshing the session (it is).
          }
        },
      },
    }
  );
}
