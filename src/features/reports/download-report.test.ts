import { describe, expect, it } from "vitest";
import { reportWorkbookFilename } from "./download-report";

describe("report workbook filenames", () => {
  it("names daily and monthly files with the selected period", () => {
    expect(reportWorkbookFilename("daily", "2026-10-29")).toBe("nicabliss-reporte-diario-2026-10-29.xlsx");
    expect(reportWorkbookFilename("monthly", "2026-10")).toBe("nicabliss-reporte-mensual-2026-10.xlsx");
  });

  it("uses Monday through Sunday boundaries for weekly filenames", () => {
    expect(reportWorkbookFilename("weekly", "2026-10-29")).toBe("nicabliss-reporte-semanal-2026-10-26-a-2026-11-01.xlsx");
    expect(reportWorkbookFilename("weekly", "2026-11-01")).toBe("nicabliss-reporte-semanal-2026-10-26-a-2026-11-01.xlsx");
  });
});
