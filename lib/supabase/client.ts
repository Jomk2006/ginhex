"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { clientEnv } from "@/lib/env";

// One client per browser tab, reused across the app. RLS applies
// using the signed-in user's session — this client can never see
// more than the current user is authorized for.
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
