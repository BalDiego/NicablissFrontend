export function saveReportWorkbook(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function reportWorkbookFilename(period: "daily" | "weekly" | "monthly", value: string): string {
  if (period === "monthly") return `nicabliss-reporte-mensual-${value}.xlsx`;
  if (period === "daily") return `nicabliss-reporte-diario-${value}.xlsx`;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, month - 1, day - daysSinceMonday, 12));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 12));
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  return `nicabliss-reporte-semanal-${from}-a-${to}.xlsx`;
}
