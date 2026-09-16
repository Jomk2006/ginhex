import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const clientEnvSchema = serverEnvSchema.omit({ SUPABASE_SERVICE_ROLE_KEY: true });

function loadServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables — check .env.local");
  }
  return parsed.data;
}

function loadClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    console.error("Invalid public environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid public environment variables — check .env.local");
  }
  return parsed.data;
}

// Only touch the service-role var on the server — importing this file
// from a Client Component build will fail loudly rather than leak it.
export const serverEnv = typeof window === "undefined" ? loadServerEnv() : (undefined as never);
export const clientEnv = loadClientEnv();
