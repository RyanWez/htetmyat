'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';

async function verifyAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function fetchTemplates() {
  await verifyAdmin();
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Error fetching templates:', err);
    return { success: false, data: [], error: 'Failed to fetch templates' };
  }
}

export async function updateTemplate(name: string, title_template: string, message_template: string) {
  await verifyAdmin();
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('notification_templates')
      .update({ title_template, message_template, updated_at: new Date().toISOString() })
      .eq('name', name);
    
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error updating template:', err);
    return { success: false, error: 'Failed to update template' };
  }
}

export async function sendManualNotification(params: { title: string; message: string; link?: string; type: 'global' | 'personal'; userId?: string; sendPush?: boolean }) {
  await verifyAdmin();
  
  try {
    const supabase = await createServiceClient();
    
    // 1. In-App Notification
    const payload = {
      title: params.title,
      message: params.message,
      link: params.link || null,
      type: params.type,
      user_id: params.type === 'personal' ? params.userId || null : null,
    };
    
    const { error } = await supabase.from('notifications').insert(payload);
    if (error) throw error;
    
    // 2. Optional Web Push
    if (params.sendPush) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`;
      
      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
        
        // If personal, we'd need to fetch just that user's subscriptions. 
        // For simplicity and matching current feature, we just broadcast if no user specified, or target if user ID given.
        let query = supabase.from('push_subscriptions').select('*');
        if (params.type === 'personal' && params.userId) {
          query = query.eq('user_id', params.userId);
        }
        
        const { data: subs, error: subsError } = await query;
          
        if (!subsError && subs && subs.length > 0) {
          const pushPayload = JSON.stringify({
            title: params.title,
            body: params.message,
            data: { url: params.link || '/' }
          });

          await Promise.allSettled(subs.map(sub => {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            };
            return webpush.sendNotification(pushSubscription, pushPayload);
          }));
        }
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error sending notification:', err);
    return { success: false, error: 'Failed to send notification' };
  }
}
