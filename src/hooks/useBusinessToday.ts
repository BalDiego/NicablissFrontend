import { useEffect, useState } from "react";
import { businessToday } from "../utils/businessDate";

const DATE_CHECK_INTERVAL_MS = 60_000;

export function useBusinessToday(): string {
  const [today, setToday] = useState(() => businessToday());

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const nextToday = businessToday();
      setToday((current) => current === nextToday ? current : nextToday);
    };
    const interval = window.setInterval(refresh, DATE_CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return today;
}
