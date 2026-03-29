'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import AccountGuard from '@/components/AccountGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccountGuard />
      <ToastProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
