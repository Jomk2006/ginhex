import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export async function CtaSection() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, transparent 0 46px, rgba(208,255,0,0.6) 46px 47px), repeating-linear-gradient(60deg, transparent 0 46px, rgba(208,255,0,0.6) 46px 47px)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {isAr ? "جاهز تبني اللي جاي؟" : "Ready to build what's next?"}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/70">
            {isAr
              ? "انضم لـ GENHEX وابدأ أول دورة، أو قدّم فكرتك في Labs، النهاردة."
              : "Join GENHEX and start your first course, or bring your idea to Labs, today."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-[#00BCC8] text-[#0A0A0A] hover:bg-[#00BCC8]/90">
              <Link href="/sign-up">{isAr ? "ابدأ الآن" : "Get started"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/courses">{isAr ? "تصفّح الدورات" : "Browse courses"}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
