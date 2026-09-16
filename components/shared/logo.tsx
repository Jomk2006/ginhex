import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the official GENHEX logo -- never regenerated or redrawn.
 * Two variants, both pixel-for-pixel crops of the one supplied asset
 * (no artwork was redrawn or altered):
 *
 * - "icon" (default): just the hex mark, cropped tightly from the
 *   source lockup. Every current call site (nav, footer, auth pages)
 *   renders at 40-60px tall, and the full lockup -- icon + "GENHEX"
 *   wordmark + "Build what's next." tagline stacked in one square --
 *   is illegible at that size; the wordmark and tagline shrink to a
 *   couple of pixels tall. The icon alone reads fine that small and
 *   is what every other product's collapsed/compact nav mark does.
 * - "full": the original square lockup, unchanged, for contexts
 *   large enough for the wordmark to actually read (roughly 160px+).
 *
 * Wrapped in a small white rounded plate rather than placed directly
 * on the page background, since the source has no alpha channel --
 * keeps it reading cleanly on both dark and light surfaces. The plate
 * is a container we own, not an edit to the logo itself.
 */
export function Logo({
  className,
  height = 56,
  variant = "icon",
}: {
  className?: string;
  height?: number;
  variant?: "icon" | "full";
}) {
  // Proportional inset (~12% each side) rather than a fixed pixel value,
  // so the plate keeps looking right at any requested size.
  const inset = Math.round(height * 0.12);
  const imageSize = height - inset * 2;
  const src = variant === "icon" ? "/brand/genhex-icon.jpeg" : "/brand/genhex-logo.jpeg";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5",
        className
      )}
      style={{ height, padding: inset }}
    >
      <Image
        src={src}
        alt="GENHEX — Build What's Next."
        width={imageSize}
        height={imageSize}
        className="h-full w-auto object-contain"
        priority
      />
    </span>
  );
}
