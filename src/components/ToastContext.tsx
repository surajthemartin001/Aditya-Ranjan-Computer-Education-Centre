import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirmChoice = (choice: boolean) => {
    if (confirmState) {
      confirmState.resolve(choice);
      setConfirmState(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border bg-white shadow-sm text-sm ${
              toast.variant === 'success'
                ? 'border-emerald-200 text-slate-900'
                : toast.variant === 'error'
                  ? 'border-red-200 text-slate-900'
                  : 'border-slate-200 text-slate-900'
            }`}
          >
            {toast.variant === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            )}
            {toast.variant === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            )}
            {toast.variant === 'info' && (
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close notification"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900">{confirmState.options.title}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {confirmState.options.message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirmChoice(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {confirmState.options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmChoice(true)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmState.options.destructive
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                {confirmState.options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
