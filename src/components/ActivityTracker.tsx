'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only fire tracking on client in a simple non-blocking way
    const track = async () => {
      try {
        // We use an API route or server action to track
        // Importing server action here for simplicity
        const { logActivityAction } = await import('@/app/actions/tracking');
        await logActivityAction('page_view', { path: pathname });
      } catch (e) {
        // Ignore failures in background tracking
      }
    };
    
    // Slight delay to not block main thread
    const timeout = setTimeout(track, 1000);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
