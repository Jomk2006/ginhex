import { HeroSection } from "@/components/marketing/hero-section";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { CtaSection } from "@/components/marketing/cta-section";

export default function MarketingHome() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <FeatureGrid />
      <CtaSection />
    </>
  );
}
