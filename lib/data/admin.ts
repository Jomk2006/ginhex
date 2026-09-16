import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Platform-wide counts for the admin overview. RLS already scopes these
 * queries correctly (admin sees everything), so no service-role client
 * is needed here — this all runs through the normal session-scoped
 * server client like every other read in the app.
 */
export async function getPlatformStats() {
  const supabase = await createClient();

  const [
    { count: totalStudents },
    { count: totalInstructors },
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalEnrollments },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "instructor"),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalStudents: totalStudents ?? 0,
    totalInstructors: totalInstructors ?? 0,
    totalCourses: totalCourses ?? 0,
    publishedCourses: publishedCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
  };
}

/** Every course on the platform, regardless of owner or status — admin RLS allows this unrestricted. */
export async function getAllCoursesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Every user profile on the platform, for the admin Users section, with
 * email attached from auth.users. Email isn't stored on `profiles` (by
 * design -- see the schema notes), and auth.users isn't reachable via
 * the normal RLS-scoped client, so this is one of the few legitimate,
 * server-only uses of the service-role client: a read-only admin listing,
 * never exposed to the browser, gated by the page's own admin check above
 * this function in every caller.
 */
export async function getAllProfiles() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const serviceRole = createServiceRoleClient();
  const { data: usersPage } = await serviceRole.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map(usersPage?.users.map((u) => [u.id, u.email ?? ""]) ?? []);

  return profiles.map((p) => ({ ...p, email: emailById.get(p.id) ?? "" }));
}
