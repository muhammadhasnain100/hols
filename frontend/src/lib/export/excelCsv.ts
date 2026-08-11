/** Excel-friendly CSV helpers (UTF-8 BOM). Opens cleanly in Excel / Google Sheets. */

export type ExcelCell = string | number | boolean | null | undefined;

function escapeCell(value: ExcelCell): string {
  if (value == null) return "";
  const text = typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(headers: string[], rows: ExcelCell[][]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  return lines.join("\r\n");
}

export function downloadExcelCsv(filename: string, headers: string[], rows: ExcelCell[][]) {
  const csv = rowsToCsv(headers, rows);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamped =
    filename.endsWith(".csv") || filename.endsWith(".xlsx")
      ? filename
      : `${filename}.csv`;
  anchor.href = url;
  anchor.download = stamped.replace(/\.xlsx$/i, ".csv");
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportStamp(prefix: string) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
