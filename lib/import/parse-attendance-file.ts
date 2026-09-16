import "server-only";
import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: string | number | undefined;
}

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB cap — deliberately small given the
// unpatched xlsx parser advisory (ReDoS/prototype pollution); this limits the blast radius
// of a maliciously crafted file without eliminating the underlying library risk.

export function parseAttendanceFile(buffer: ArrayBuffer): ParsedRow[] {
  if (buffer.byteLength > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" });
  return rows;
}

/** Normalizes whatever the file's header casing/spacing was into the fields we care about. */
export function extractRowFields(row: ParsedRow) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = String(value ?? "").trim();
  }

  return {
    name: normalized["name"] ?? normalized["full name"] ?? normalized["full_name"] ?? "",
    email: normalized["email"] ?? "",
    genhexId: normalized["genhex id"] ?? normalized["genhex_id"] ?? normalized["student id"] ?? normalized["studentid"] ?? "",
    status: normalized["status"] ?? normalized["attendance"] ?? "",
  };
}
