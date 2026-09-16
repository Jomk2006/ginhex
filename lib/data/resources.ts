import "server-only";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes — long enough to open/download, short-lived by design

export async function getLessonResources(lessonId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  // For uploaded files (file_url holds a private Storage path, not a
  // public URL), resolve a short-lived signed URL now. This call itself
  // goes through the session-scoped client, so it silently returns no
  // signed URL for anyone the storage.objects SELECT policy wouldn't
  // authorize anyway -- the signing step IS the authorization check.
  const withUrls = await Promise.all(
    data.map(async (resource) => {
      if (resource.type !== "link" && resource.file_url) {
        const { data: signed } = await supabase.storage
          .from("course-materials")
          .createSignedUrl(resource.file_url, SIGNED_URL_TTL_SECONDS);
        return { ...resource, resolvedUrl: signed?.signedUrl ?? null };
      }
      return { ...resource, resolvedUrl: resource.external_url };
    })
  );

  return withUrls;
}

export async function getCourseResources(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*, lessons(title_en, title_ar)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
