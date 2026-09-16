"use client";

// Minimal shape of the parts of the Pyodide API this component uses.
interface PyodideInterface {
  runPython(code: string): unknown;
  runPythonAsync(code: string): Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

const PYODIDE_VERSION = "v0.26.4";
const PYODIDE_CDN_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodideInstancePromise: Promise<PyodideInterface> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(script);
  });
}

/** Loads and caches a single Pyodide runtime instance (large WASM download, only fetched once, lazily, the first time Python is actually run). */
async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideInstancePromise) {
    pyodideInstancePromise = (async () => {
      await loadScript(`${PYODIDE_CDN_BASE}pyodide.js`);
      if (!window.loadPyodide) {
        throw new Error("Pyodide failed to attach to window");
      }
      return window.loadPyodide({ indexURL: PYODIDE_CDN_BASE });
    })();
  }
  return pyodideInstancePromise;
}

export interface RunPythonResult {
  output: string;
  error: string | null;
}

/** Runs Python source and returns captured stdout, plus any error text (never throws). */
export async function runPython(code: string): Promise<RunPythonResult> {
  try {
    const pyodide = await getPyodide();

    pyodide.runPython(
      ["import sys", "import io", "_genhex_stdout = io.StringIO()", "sys.stdout = _genhex_stdout"].join("\n")
    );

    let error: string | null = null;
    try {
      await pyodide.runPythonAsync(code);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const output = String(pyodide.runPython("_genhex_stdout.getvalue()"));
    pyodide.runPython("sys.stdout = sys.__stdout__");

    return { output, error };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Failed to load the Python runtime." };
  }
}
