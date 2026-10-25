import { createContext } from "react";

export type FeedbackContextValue = {
  notify: (message: string, type?: "success" | "error") => void;
  confirm: (message: string) => Promise<boolean>;
};

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);
