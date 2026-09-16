"use client";

import { cn } from "@/lib/utils";

export function CodeEditor({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      spellCheck={false}
      dir="ltr"
      className={cn(
        "w-full resize-none rounded-md border border-border bg-[#0A0A0A] p-4 font-mono text-sm text-[#00B6BF] outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    />
  );
}
