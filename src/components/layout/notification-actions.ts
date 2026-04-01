'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export type NotificationWithRead = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  type: string;
  created_at: string;
  is_read: boolean;
};

export async function getMyNotifications(): Promise<{ success: boolean; data?: NotificationWithRead[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
    const userId = session.user.id;

    const supabase = await createServiceClient();

    // Fetch relevant notifications: globals + personal
    const { data: notis, error: notiError } = await supabase
      .from('notifications')
      .select('*')
      .or(`type.eq.global,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (notiError) throw notiError;

    // Fetch reads
    const { data: reads, error: readsError } = await supabase
      .from('user_noti_reads')
      .select('notification_id')
      .eq('user_id', userId);

    if (readsError) throw readsError;

    const readSet = new Set(reads?.map(r => r.notification_id));

    // Combine
    const result: NotificationWithRead[] = (notis || []).map(n => ({
      ...n,
      is_read: readSet.has(n.id)
    }));

    return { success: true, data: result };
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return { success: false, error: 'Failed' };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    const userId = session.user.id;

    const supabase = await createServiceClient();

    // Insert into user_noti_reads
    const { error } = await supabase.from('user_noti_reads').insert({
      user_id: userId,
      notification_id: notificationId,
      read_at: new Date().toISOString()
    }).select().single();

    // Ignore unique constraint errors
    if (error && error.code !== '23505') throw error;

    return { success: true };
  } catch (err) {
    console.error('Error marking as read:', err);
    return { success: false };
  }
}
