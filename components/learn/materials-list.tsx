"use client";

import { FileText, Link2, Download } from "lucide-react";
import { useLocale } from "next-intl";

export interface ResolvedResource {
  id: string;
  title_en: string;
  title_ar: string;
  type: string;
  resolvedUrl: string | null;
}

export function MaterialsList({ resources }: { resources: ResolvedResource[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (resources.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">{isAr ? "المواد التعليمية" : "Materials"}</p>
      <ul className="flex flex-col gap-1">
        {resources.map((r) => (
          <li key={r.id}>
            <a
              href={r.resolvedUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {r.type === "link" ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              {isAr ? r.title_ar : r.title_en}
              {r.type !== "link" && <Download className="h-3 w-3 text-muted-foreground" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
