import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutoRefresh } from "./useAutoRefresh";

describe("useAutoRefresh", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reloads after mutations, when the tab becomes visible, and periodically", () => {
    vi.useFakeTimers();
    const load = vi.fn();
    renderHook(() => useAutoRefresh(load, 1_000));

    act(() => vi.advanceTimersByTime(0));
    expect(load).toHaveBeenLastCalledWith(false);

    act(() => window.dispatchEvent(new CustomEvent("nicabliss:data-mutated")));
    expect(load).toHaveBeenLastCalledWith(true);

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(load).toHaveBeenCalledTimes(3);

    act(() => vi.advanceTimersByTime(1_000));
    expect(load).toHaveBeenCalledTimes(4);
    expect(load).toHaveBeenLastCalledWith(true);
  });
});
