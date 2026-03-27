'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import styles from './ConfirmDialog.module.css';

/* ───── Types ───── */
interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

/* ───── Icons ───── */
const dangerIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const defaultIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ───── Provider ───── */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({
    open: false,
    options: { title: '', message: '' },
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  if (typeof window !== 'undefined' && !mounted) {
    setMounted(true);
  }

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const { open, options } = state;
  const isDanger = options.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {mounted && open && createPortal(
        <div className={styles.overlay} onClick={() => handleClose(false)}>
          <motion.div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.header}>
              <div className={`${styles.iconWrap} ${isDanger ? styles.iconDanger : styles.iconDefault}`}>
                {isDanger ? dangerIcon : defaultIcon}
              </div>
              <div className={styles.textContent}>
                <h3 className={styles.title}>{options.title}</h3>
                <p className={styles.message}>{options.message}</p>
              </div>
            </div>
            <div className={styles.footer}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleClose(false)}
                autoFocus
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleClose(true)}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body,
      )}
    </ConfirmContext.Provider>
  );
}
