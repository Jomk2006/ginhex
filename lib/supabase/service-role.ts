import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { serverEnv } from "@/lib/env";

/**
 * Bypasses RLS entirely. Use ONLY inside the specific server-only
 * paths the schema design calls out as service-role-only:
 *   - attendance import commit
 *   - exam attempt creation / autograde (start_exam_attempt RPC)
 *   - certificate issuance / revocation
 *   - event registration + waitlist promotion (locking RPCs)
 *   - system-generated notifications
 *
 * Every call site using this client MUST write an audit_logs row.
 * Never import this in a Client Component or expose it to the browser
 * — the "server-only" import makes that a build-time error, not a
 * runtime surprise.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
