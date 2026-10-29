import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutoRefresh } from "./useAutoRefresh";

describe("useAutoRefresh", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reloads after mutations and on return to a visible tab, and pauses polling while hidden", async () => {
    vi.useFakeTimers();
    const load = vi.fn();
    const visibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const { unmount } = renderHook(() => useAutoRefresh(load, 1_000));

    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });
    expect(load).toHaveBeenLastCalledWith(false);

    await act(async () => {
      window.dispatchEvent(new CustomEvent("nicabliss:data-mutated"));
      await Promise.resolve();
    });
    expect(load).toHaveBeenLastCalledWith(true);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(2);

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(load).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(3);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(4);
    expect(load).toHaveBeenLastCalledWith(true);

    unmount();
    act(() => window.dispatchEvent(new CustomEvent("nicabliss:data-mutated")));
    expect(load).toHaveBeenCalledTimes(4);

    if (visibilityDescriptor) Object.defineProperty(document, "visibilityState", visibilityDescriptor);
    else Reflect.deleteProperty(document, "visibilityState");
  });
});
