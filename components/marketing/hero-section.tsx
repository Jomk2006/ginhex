import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GenhexCoreScene } from "@/components/marketing/genhex-core-scene";
import { ArrowRight, ArrowLeft } from "lucide-react";

export async function HeroSection() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="hero-min-h relative -mt-24 flex items-end overflow-hidden bg-[#0A0A0A]">
      {/* Full-bleed 3D background -- the GENHEX Core, standing in for the
          reference design's Spline embed */}
      <div className="absolute inset-0">
        <GenhexCoreScene />
      </div>

      {/* Hex-grid backdrop -- brand board's own graphic motif */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px), repeating-linear-gradient(60deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px)",
        }}
        aria-hidden="true"
      />

      {/* Dark scrim so text stays legible over the 3D scene, same role as
          the reference's bg-black/30 overlay */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/70 via-black/20 to-black/40" aria-hidden="true" />

      {/* Content -- anchored bottom-left, pointer-events-none so drag/hover
          on the 3D scene still works through the empty space around text;
          buttons re-enable pointer-events individually */}
      <div className="relative z-10 w-full max-w-[90%] px-6 pb-8 pt-24 pointer-events-none sm:max-w-md sm:pb-14 sm:pt-32 md:px-10 md:pb-16 lg:max-w-2xl">
        <span
          className="animate-fade-up-blur inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#00BCC8] opacity-0"
          style={{ animationDelay: "0.2s" }}
        >
          {isAr ? "منصة تعليم تقني ثنائية اللغة" : "A bilingual technology education platform"}
        </span>

        <h1
          className="animate-fade-up-blur mb-2 mt-4 text-[clamp(3rem,8vw,6rem)] font-bold uppercase leading-[1.05] tracking-[-0.03em] text-white opacity-0 md:mb-4"
          style={{ animationDelay: "0.35s" }}
        >
          <span className="text-white">GEN</span>
          <span className="text-[#00B6BF]">HEX</span>
        </h1>

        <p
          className="animate-fade-up-blur mb-3 text-[clamp(1.125rem,2.5vw,1.875rem)] font-light text-white/80 opacity-0 md:mb-6"
          style={{ animationDelay: "0.5s" }}
        >
          {isAr ? "ابنِ ما هو قادم." : "Build what's next."}
        </p>

        <p
          className="animate-fade-up-blur mb-4 text-[clamp(0.875rem,1.5vw,1.25rem)] font-light text-white/60 opacity-0 md:mb-8"
          style={{ animationDelay: "0.65s" }}
        >
          {isAr
            ? "GENHEX منصة تجمع الدورات والحضور والاختبارات والشهادات في نظام واحد — يتعلّم فيه الطلاب، ويبني فيه المدرّبون، بالعربي والإنجليزي."
            : "GENHEX brings courses, attendance, exams, and certificates into one system — where students learn and instructors build, in Arabic and English."}
        </p>

        <div className="flex flex-wrap gap-3 font-bold" style={{ animationDelay: "0.8s" }}>
          <Link
            href="/courses"
            className="animate-fade-up-blur pointer-events-auto cursor-pointer rounded-sm bg-[#00BCC8] px-6 py-3 text-sm text-[#0A0A0A] opacity-0 transition-all hover:brightness-110 active:scale-[0.97] md:px-8 md:py-4"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="inline-flex items-center gap-2">
              {isAr ? "استكشف الدورات" : "Explore courses"}
              <Arrow className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/sign-up"
            className="animate-fade-up-blur pointer-events-auto cursor-pointer rounded-sm bg-white px-6 py-3 text-sm text-[#0A0A0A] opacity-0 transition-all hover:brightness-90 active:scale-[0.97] md:px-8 md:py-4"
            style={{ animationDelay: "0.9s" }}
          >
            {isAr ? "أنشئ حسابًا" : "Create an account"}
          </Link>
        </div>

        <p
          className="animate-fade-up-blur mt-4 text-xs font-light text-white/40 opacity-0 md:mt-6"
          style={{ animationDelay: "1.05s" }}
        >
          {isAr ? "منصة تعليم تقني موثوقة." : "A trusted technology education platform."}
        </p>
      </div>
    </section>
  );
}
