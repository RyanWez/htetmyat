'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * AccountGuard — Enforces ban/suspension in real-time.
 * 
 * When the admin suspends a user, the JWT callback marks the session
 * with `isBanned: true`. This guard detects that flag and immediately
 * calls `signOut()` to properly clear all auth cookies and redirect
 * the user to the login page with a suspended notification.
 * 
 * Place this component inside SessionProvider in the root layout.
 */
export default function AccountGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isSigningOut = useRef(false);

  useEffect(() => {
    // Only act when session is loaded and user is banned
    if (
      status === 'authenticated' &&
      session?.user?.isBanned &&
      !isSigningOut.current &&
      pathname !== '/login'
    ) {
      isSigningOut.current = true;

      // Force sign out — this properly clears all NextAuth cookies
      signOut({
        callbackUrl: '/login?reason=suspended',
        redirect: true,
      });
    }
  }, [session, status, pathname]);

  return null;
}
