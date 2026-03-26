'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

/* ───── Types ───── */
type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ───── Icons ───── */
const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" strokeWidth="2" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const variantClass: Record<ToastVariant, string> = {
  success: styles.toastSuccess,
  error: styles.toastError,
  info: styles.toastInfo,
};

/* ───── Provider ───── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => { setMounted(true); }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ id, variant, title, message }, ...prev.slice(0, 3)]);

    const timer = setTimeout(() => removeToast(id), 3000);
    timersRef.current.set(id, timer);

    return id;
  }, [removeToast]);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
    removeToast(id);
  }, [removeToast]);

  const api: ToastContextValue = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message),
    info: (title, message) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted && createPortal(
        <div className={styles.toastContainer} aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${variantClass[toast.variant]} ${toast.exiting ? styles.toastExiting : ''}`}
              role="alert"
            >
              <div className={styles.toastIcon}>{icons[toast.variant]}</div>
              <div className={styles.toastBody}>
                <div className={styles.toastTitle}>{toast.title}</div>
                {toast.message && <div className={styles.toastMessage}>{toast.message}</div>}
              </div>
              <button className={styles.toastClose} onClick={() => dismiss(toast.id)} aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
