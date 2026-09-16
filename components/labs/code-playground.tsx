"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Play, Loader2 } from "lucide-react";
import { CodeEditor } from "@/components/labs/code-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runPython } from "@/lib/labs/run-python";

const DEFAULT_PYTHON = `# Write Python and hit Run.
name = "GENHEX"
print(f"Hello, {name}!")

for i in range(1, 4):
    print(f"Step {i}")
`;

const DEFAULT_HTML = `<!-- Write HTML and hit Run to preview -->
<div style="font-family: sans-serif; padding: 24px; text-align: center;">
  <h1 style="color: #00B6BF;">Hello, GENHEX!</h1>
  <p>Edit this and press Run.</p>
</div>
`;

type Tab = "python" | "html";

export function CodePlayground() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [tab, setTab] = useState<Tab>("python");

  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON);
  const [pythonOutput, setPythonOutput] = useState<string>("");
  const [pythonError, setPythonError] = useState<string | null>(null);
  const [isRunningPython, startPythonTransition] = useTransition();

  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML);
  const [htmlPreview, setHtmlPreview] = useState(DEFAULT_HTML);

  function runCurrent() {
    if (tab === "html") {
      setHtmlPreview(htmlCode);
      return;
    }
    startPythonTransition(async () => {
      setPythonError(null);
      const result = await runPython(pythonCode);
      setPythonOutput(result.output);
      setPythonError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["python", "html"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "python" ? "Python" : "HTML"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={runCurrent} disabled={isRunningPython}>
          {isRunningPython ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isAr ? "تشغيل" : "Run"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tab === "python" ? (
          <>
            <CodeEditor value={pythonCode} onChange={setPythonCode} className="h-80" placeholder="print('hello')" />
            <div className="flex h-80 flex-col overflow-hidden rounded-md border border-border">
              <div className="border-b border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {isAr ? "المخرجات" : "Output"}
              </div>
              <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm">
                {isRunningPython && !pythonOutput && !pythonError ? (
                  <span className="text-muted-foreground">
                    {isAr ? "جارٍ تحميل بيئة Python (أول مرة بس)..." : "Loading the Python runtime (first run only)..."}
                  </span>
                ) : (
                  <>
                    {pythonOutput}
                    {pythonError && <span className="text-destructive">{pythonError}</span>}
                    {!pythonOutput && !pythonError && (
                      <span className="text-muted-foreground">
                        {isAr ? "اضغط تشغيل عشان تشوف النتيجة." : "Press Run to see the output."}
                      </span>
                    )}
                  </>
                )}
              </pre>
            </div>
          </>
        ) : (
          <>
            <CodeEditor value={htmlCode} onChange={setHtmlCode} className="h-80" placeholder="<h1>Hello</h1>" />
            <div className="h-80 overflow-hidden rounded-md border border-border bg-white">
              <iframe title="HTML preview" srcDoc={htmlPreview} sandbox="allow-scripts" className="h-full w-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
