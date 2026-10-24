import { useContext } from "react";
import { FeedbackContext } from "../contexts/feedback-context";

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback debe utilizarse dentro de FeedbackProvider");
  return context;
}
