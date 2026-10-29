import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBusinessToday } from "./useBusinessToday";

describe("useBusinessToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances the default business date across Managua midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T05:59:00.000Z"));
    const { result } = renderHook(() => useBusinessToday());
    expect(result.current).toBe("2026-12-31");

    act(() => {
      vi.setSystemTime(new Date("2027-01-01T06:00:00.000Z"));
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current).toBe("2027-01-01");
  });
});
