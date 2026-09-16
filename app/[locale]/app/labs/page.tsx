import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CodePlayground } from "@/components/labs/code-playground";

export default async function LabsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">GENHEX Labs</h1>
        <p className="text-muted-foreground">
          {isAr
            ? "جرّب وابنِ — محرّر بايثون و HTML مباشر في المتصفح، من غير أي إعداد."
            : "Build and experiment — a live Python and HTML playground, right in the browser, no setup."}
        </p>
      </div>
      <CodePlayground />
    </div>
  );
}
