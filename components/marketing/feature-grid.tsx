import { getLocale } from "next-intl/server";
import { GraduationCap, FlaskConical, Users, CalendarDays } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const FEATURES = [
  {
    icon: GraduationCap,
    titleEn: "Academy",
    titleAr: "الأكاديمية",
    bodyEn: "Structured courses with lesson-by-lesson progress, attendance, and gated exams — real learning, tracked properly.",
    bodyAr: "دورات منظَّمة مع تتبّع تقدّم لكل درس، وحضور، واختبارات مرتبطة بالحضور — تعلّم حقيقي ومُتابَع بدقة.",
  },
  {
    icon: FlaskConical,
    titleEn: "Labs",
    titleAr: "Labs",
    bodyEn: "Build, experiment, and ship real projects — from idea to prototype to something running in production.",
    bodyAr: "ابنِ وجرّب وأطلق مشاريع حقيقية — من الفكرة، إلى النموذج الأولي، إلى نظام يعمل فعليًا.",
  },
  {
    icon: Users,
    titleEn: "Community",
    titleAr: "المجتمع",
    bodyEn: "A community of builders and learners — share ideas, get feedback, and grow together.",
    bodyAr: "مجتمع من البنّائين والمتعلّمين — شارك أفكارك، واحصل على تغذية راجعة، وانمُ مع الآخرين.",
  },
  {
    icon: CalendarDays,
    titleEn: "Events",
    titleAr: "الفعاليات",
    bodyEn: "Masterclasses, workshops, and lab sessions that connect builders and learners from around the world.",
    bodyAr: "دورات متقدّمة وورش عمل وجلسات Labs تربط البنّائين والمتعلّمين حول العالم.",
  },
];

export async function FeatureGrid() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <h2 className="mb-2 text-3xl font-semibold tracking-tight">
          {isAr ? "نظام واحد، أربع طرق للبناء" : "One system, four ways to build"}
        </h2>
        <p className="mb-12 max-w-xl text-muted-foreground">
          {isAr
            ? "GENHEX مش مجرد منصة كورسات — هي المكان اللي فيه تتعلّم، وتبني، وتتواصل مع مجتمع حقيقي."
            : "GENHEX isn't just a course platform — it's where you learn, build, and connect with a real community."}
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.titleEn} delay={i * 100}>
              <div className="group h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#00BCC8]/40 hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#00BCC8]/10 text-[#00BCC8] transition-colors group-hover:bg-[#00BCC8] group-hover:text-[#0A0A0A]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{isAr ? feature.titleAr : feature.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? feature.bodyAr : feature.bodyEn}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
