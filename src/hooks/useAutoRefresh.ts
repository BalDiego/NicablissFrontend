import { useEffect } from "react";

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

type RefreshableLoad = (force?: boolean) => void | Promise<void>;

export function useAutoRefresh(
  load: RefreshableLoad,
  intervalMs = DEFAULT_REFRESH_INTERVAL_MS
): void {
  useEffect(() => {
    let active = true;
    let inFlight = false;
    let refreshPending = false;
    let pendingForce = false;
    const refresh = (force = true) => {
      if (!active) return;
      if (inFlight) {
        refreshPending = true;
        pendingForce ||= force;
        return;
      }

      inFlight = true;
      const complete = () => {
        inFlight = false;
        if (!active || !refreshPending) return;
        const nextForce = pendingForce;
        refreshPending = false;
        pendingForce = false;
        refresh(nextForce);
      };
      try {
        void Promise.resolve(load(force)).then(complete, complete);
      } catch {
        complete();
      }
    };
    const onDataMutated = () => refresh(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh(true);
    }, intervalMs);
    const initialLoad = window.setTimeout(() => refresh(false), 0);

    window.addEventListener("nicabliss:data-mutated", onDataMutated);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("nicabliss:data-mutated", onDataMutated);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, load]);
}
