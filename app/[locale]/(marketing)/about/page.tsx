import { getLocale } from "next-intl/server";
import { GraduationCap, Video, Award, Users, Target } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const pillars = [
    {
      icon: Video,
      titleEn: "Free live courses",
      titleAr: "دورات مباشرة مجانية",
      bodyEn: "Real-time sessions where you learn alongside other students, ask questions, and get answers on the spot — at no cost.",
      bodyAr: "جلسات مباشرة بتتعلّم فيها مع طلاب تانيين، وتقدر تسأل وتاخد إجابة في اللحظة، من غير أي تكلفة.",
    },
    {
      icon: GraduationCap,
      titleEn: "Professionally recorded courses",
      titleAr: "دورات مسجَّلة باحترافية",
      bodyEn: "Structured, well-produced lessons you can revisit anytime — built with the same care as a live classroom, minus the schedule.",
      bodyAr: "دروس منظَّمة ومُنتَجة باحتراف تقدر ترجعلها في أي وقت — بنفس مستوى الكلاس المباشر، من غير الالتزام بميعاد.",
    },
    {
      icon: Award,
      titleEn: "A certificate that means something",
      titleAr: "شهادة ليها قيمة فعلية",
      bodyEn: "Finish a course and earn a certificate tied to real attendance and real assessment — not just a name on a PDF.",
      bodyAr: "لما تخلّص الدورة، بتاخد شهادة مرتبطة بحضور حقيقي وتقييم حقيقي — مش مجرد اسم على PDF.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <Reveal>
        <span className="mb-4 inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {isAr ? "من نحن" : "About GENHEX"}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          {isAr ? (
            <>نحن مش بس بنعلّم دورات — إحنا بنبني مستقبل مهني.</>
          ) : (
            <>We&apos;re not just teaching courses. We&apos;re building careers.</>
          )}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          {isAr
            ? "GENHEX مركز تعليم تقني بيقدّم دورات مجانية مباشرة ودورات مسجَّلة باحترافية عالية، وكل دورة بتنتهي بشهادة اجتياز حقيقية — مبنية على حضور فعلي وتقييم فعلي، مش مجرد اسم."
            : "GENHEX is a technology education center offering free live courses and professionally recorded courses — every course ends with a real certificate of completion, backed by actual attendance and actual assessment, not just a name on a page."}
        </p>
      </Reveal>

      <Reveal delay={100} className="mt-16">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#00BCC8]/10 text-[#00BCC8]">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="mb-3 text-xl font-semibold">{isAr ? "مهمتنا" : "Our mission"}</h2>
          <p className="text-muted-foreground">
            {isAr
              ? "هدفنا إن كل طالب في جمهورية مصر العربية يلاقي المجال التقني المناسب له، ويتعلّمه صح من الأساس لحد ما يبقى محترف حقيقي فيه — مش بس شخص شاف كورس وخلص. إحنا هنا عشان نقرّب المسافة بين اللي الطالب بيحبه واللي الطالب ممكن يشتغل بيه."
              : "Our goal is for every student across Egypt to find the technology field that genuinely fits them, learn it properly from the ground up, and grow into a real professional in it — not just someone who watched a course and moved on. We exist to close the gap between what a student loves and what a student can build a career on."}
          </p>
        </div>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {pillars.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <Reveal key={pillar.titleEn} delay={i * 100}>
              <div className="h-full rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#00BCC8]/10 text-[#00BCC8]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{isAr ? pillar.titleAr : pillar.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? pillar.bodyAr : pillar.bodyEn}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={200} className="mt-16">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#D0FF00]/10 text-[#0A0A0A] dark:text-[#D0FF00]">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="mb-3 text-xl font-semibold">{isAr ? "الفريق" : "The team"}</h2>
          <p className="text-muted-foreground">
            {isAr
              ? "إحنا فريق صغير ومتماسك، كل واحد فينا شغال بشغف حقيقي في مجاله — مش شركة ضخمة بعيدة عن طلابها. القرب ده هو اللي بيخلّينا نسمع كل طالب، ونطوّر المنصة والمحتوى بناءً على احتياجه الحقيقي، مش افتراضات بعيدة عن الواقع."
              : "We're a small, close-knit team, each of us genuinely passionate about our own craft — not a distant, oversized company. That closeness is exactly what lets us actually listen to every student and shape the platform and content around real needs, not guesses made from a distance."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={300} className="mt-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">
          {isAr ? "جاهز تلاقي مجالك؟" : "Ready to find your field?"}
        </h2>
        <Button asChild size="lg">
          <Link href="/courses">{isAr ? "استكشف الدورات" : "Explore courses"}</Link>
        </Button>
      </Reveal>
    </div>
  );
}
