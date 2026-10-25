import { useCallback, useMemo, useState } from "react";
import { FeedbackContext } from "./feedback-context";

type Toast = { id: number; message: string; type: "success" | "error" };
type Confirmation = {
  message: string;
  resolve: (accepted: boolean) => void;
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const notify = useCallback((message: string, type: Toast["type"] = "success") => {
    const next = { id: Date.now(), message, type };
    setToast(next);
    window.setTimeout(() => {
      setToast((current) => (current?.id === next.id ? null : current));
    }, 4000);
  }, []);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({ message, resolve });
    });
  }, []);

  const closeConfirmation = (accepted: boolean) => {
    confirmation?.resolve(accepted);
    setConfirmation(null);
  };

  const value = useMemo(() => ({ notify, confirm }), [confirm, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`global-toast global-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
      {confirmation && (
        <div className="global-dialog-backdrop" role="presentation">
          <section className="global-dialog" role="alertdialog" aria-modal="true">
            <h2>Confirmar operación</h2>
            <p>{confirmation.message}</p>
            <div>
              <button type="button" onClick={() => closeConfirmation(false)}>
                Cancelar
              </button>
              <button type="button" className="global-dialog-primary" onClick={() => closeConfirmation(true)}>
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
