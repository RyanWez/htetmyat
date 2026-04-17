'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ActivityTracker — Optimized for Vercel free tier.
 * 
 * - Only logs ONCE per unique page path per browser session (sessionStorage dedup)
 * - Uses a longer delay (3s) to avoid blocking during navigation
 * - This reduces tracking server action calls by ~80% while still providing
 *   meaningful data for the admin dashboard charts.
 */
export default function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Deduplicate: only track each unique path once per session
    const sessionKey = `hma_tracked:${pathname}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return; // Already tracked this path in this session
    }

    const track = async () => {
      try {
        // Mark as tracked immediately to prevent race conditions
        sessionStorage.setItem(sessionKey, '1');

        const { logActivityAction } = await import('@/app/actions/tracking');
        await logActivityAction('page_view', { path: pathname });
      } catch {
        // Ignore failures in background tracking
      }
    };

    // Longer delay to avoid blocking main thread and initial page render
    const timeout = setTimeout(track, 3000);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
