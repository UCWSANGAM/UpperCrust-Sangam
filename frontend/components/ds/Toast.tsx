import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type Toast = { id: string; message: string; tone: 'success' | 'danger' | 'info' };
type ToastContextValue = { push: (message: string, tone?: Toast['tone']) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, danger: XCircle, info: Info };
const TONE_CLASSES = {
  success: 'border-success/30 bg-successSoft text-success',
  danger: 'border-danger/30 bg-dangerSoft text-danger',
  info: 'border-info/30 bg-infoSoft text-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-body shadow-md animate-in slide-in-from-bottom-2 duration-fast ${TONE_CLASSES[t.tone]}`}
            >
              <Icon size={15} />
              {t.message}
              <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} className="ml-2 opacity-60 hover:opacity-100">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
