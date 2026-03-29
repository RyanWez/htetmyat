'use server';

import { logActivity } from '@/lib/logger';

/**
 * Server action proxy for logging activity from client components
 */
export async function logActivityAction(action: string, metadata: Record<string, unknown> = {}) {
  await logActivity(action, metadata);
  return { success: true };
}
