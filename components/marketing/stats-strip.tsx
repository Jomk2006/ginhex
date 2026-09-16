import { getLocale } from "next-intl/server";
import { Reveal } from "@/components/marketing/reveal";

const STATS = [
  { value: "24", labelEn: "Projects shipped", labelAr: "مشروع منجَز" },
  { value: "13", labelEn: "Prototypes in Labs", labelAr: "نموذج أولي في Labs" },
  { value: "07", labelEn: "Systems in production", labelAr: "نظام قيد التشغيل" },
  { value: "09", labelEn: "Events run", labelAr: "فعالية أُقيمت" },
];

export async function StatsStrip() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.value} delay={i * 80}>
            <div className="flex flex-col gap-1">
              <span className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{isAr ? stat.labelAr : stat.labelEn}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
