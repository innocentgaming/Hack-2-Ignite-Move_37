import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ title, message, type: 'success' }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ title, message, type: 'error' }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ title, message, type: 'warning' }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ title, message, type: 'info' }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast viewport container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastConfig = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: Info,
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
};

export const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white ${config.border} transition-all duration-200 animate-slide-up`}
      role="alert"
    >
      <div className={`p-1 rounded-lg shrink-0 ${config.bg} ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
