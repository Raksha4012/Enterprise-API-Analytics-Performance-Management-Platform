import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  exiting?: boolean;
}

interface ToastCtx {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const iconMap = {
  success: <CheckCircle size={16} style={{ color: '#22C55E', flexShrink: 0 }} />,
  error:   <XCircle    size={16} style={{ color: '#EF4444', flexShrink: 0 }} />,
  warning: <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />,
  info:    <Info       size={16} style={{ color: '#06B6D4', flexShrink: 0 }} />,
};

const borderColors = {
  success: 'rgba(34,197,94,0.30)',
  error:   'rgba(239,68,68,0.30)',
  warning: 'rgba(245,158,11,0.30)',
  info:    'rgba(6,182,212,0.30)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now() + counter++;
    setToasts(t => [...t, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 320);
    }, 3800);
  }, []);

  const dismiss = (id: number) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 320);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast${t.exiting ? ' exiting' : ''}`}
            style={{ borderColor: borderColors[t.type] }}
          >
            {iconMap[t.type]}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
              {t.message && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{t.message}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
