import Image from "next/image";
import { cn } from "@/lib/utils";

export function CourseThumbnail({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill className={cn("object-cover", className)} />;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0A0A0A]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, transparent 0 22px, rgba(0,188,200,0.5) 22px 23px), repeating-linear-gradient(60deg, transparent 0 22px, rgba(0,188,200,0.5) 22px 23px)",
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 100 100" className="relative h-1/3 w-1/3 opacity-90" aria-hidden="true">
        <polygon
          points="50,6 89,28 89,72 50,94 11,72 11,28"
          fill="none"
          stroke="#00BCC8"
          strokeWidth="3"
        />
        <polygon
          points="50,24 73,37 73,63 50,76 27,63 27,37"
          fill="none"
          stroke="#D0FF00"
          strokeWidth="1.5"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
