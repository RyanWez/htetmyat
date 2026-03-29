import { createServiceClient } from './supabase/server';
import { auth } from './auth';

/**
 * Log a user activity to the database
 * @param action The action performed (e.g. 'page_view', 'login', 'download')
 * @param metadata Additional JSON data related to the action
 */
export async function logActivity(action: string, metadata: any = {}) {
  try {
    const session = await auth();
    const supabase = await createServiceClient();
    
    await supabase.from('activity_logs').insert({
      user_id: session?.user?.id || null,
      action,
      metadata: {
        ...metadata,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }
    });
  } catch (err) {
    // Silent fail for logging to prevent breaking the main app flow
    console.error('Failed to log activity:', err);
  }
}
