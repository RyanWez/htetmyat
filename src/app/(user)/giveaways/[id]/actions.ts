'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';

export async function addComment(formData: FormData) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) {
    throw new Error('You must be logged in to comment.');
  }

  const supabase = await createServiceClient();
  
  const giveaway_id = formData.get('giveaway_id') as string;
  const comment_text = formData.get('comment_text') as string;
  const parent_id = formData.get('parent_id') as string || null;

  if (!giveaway_id || !comment_text) {
    throw new Error('Missing fields');
  }

  if (comment_text.length > 150) {
    throw new Error('Comment must be 150 characters or less.');
  }

  const { error } = await supabase
    .from('giveaway_comments')
    .insert([
      { giveaway_id, comment_text, parent_id, user_id: user.id }
    ]);

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Comment ထည့်သွင်းခြင်း မအောင်မြင်ပါ။');
  }

  try {
    const [commenterResult, giveawayResult] = await Promise.all([
      supabase.from('profiles').select('display_name, role').eq('id', user.id).single(),
      supabase.from('giveaways').select('title').eq('id', giveaway_id).single()
    ]);

    const commenterName = commenterResult.data?.display_name || 'Someone';
    const giveawayTitle = giveawayResult.data?.title || 'Giveaway';
    const notiLink = `/giveaways/${giveaway_id}`;
    const truncatedComment = comment_text.length > 50 
      ? comment_text.substring(0, 50) + '...' 
      : comment_text;

    const notificationsToInsert: Array<{
      title: string; message: string; link: string; type: string; user_id: string;
    }> = [];

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .neq('id', user.id);

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        notificationsToInsert.push({
          title: `💬 New Comment on "${giveawayTitle}"`,
          message: `${commenterName}: "${truncatedComment}"`,
          link: notiLink,
          type: 'personal',
          user_id: admin.id
        });
      }
    }

    if (parent_id) {
      const { data: parentComment } = await supabase
        .from('giveaway_comments')
        .select('user_id, profiles(display_name)')
        .eq('id', parent_id)
        .single();

      if (parentComment && parentComment.user_id !== user.id) {
        const alreadyNotified = notificationsToInsert.some(n => n.user_id === parentComment.user_id);
        if (!alreadyNotified) {
          notificationsToInsert.push({
            title: `↩️ ${commenterName} replied to your comment`,
            message: `"${truncatedComment}" — on "${giveawayTitle}"`,
            link: notiLink,
            type: 'personal',
            user_id: parentComment.user_id
          });
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await supabase.from('notifications').insert(notificationsToInsert);

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`;

      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
        const targetUserIds = notificationsToInsert.map(n => n.user_id);

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', targetUserIds);

        if (subs && subs.length > 0) {
          const notiByUser = new Map(notificationsToInsert.map(n => [n.user_id, n]));

          await Promise.allSettled(subs.map(sub => {
            const noti = notiByUser.get(sub.user_id);
            const pushPayload = JSON.stringify({
              title: noti?.title || `💬 New Comment on "${giveawayTitle}"`,
              body: noti?.message || `${commenterName} commented`,
              data: { url: notiLink }
            });
            return webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            );
          }));
        }
      }
    }
  } catch (notiErr) {
    console.error('Comment notification error:', notiErr);
  }

  revalidatePath(`/giveaways/${giveaway_id}`);
}

export async function deleteComment(commentId: string, giveawayId: string) {
  const session = await auth();
  const user = session?.user;
  
  if (!user || user.role !== 'admin') {
    throw new Error('Only admins can delete comments.');
  }

  const supabase = await createServiceClient();

  const { data: comment, error: fetchError } = await supabase
    .from('giveaway_comments')
    .select('*, profiles(role)')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    throw new Error('Comment not found.');
  }

  const targetIsAdmin = Array.isArray(comment.profiles) 
    ? comment.profiles[0]?.role === 'admin' 
    : comment.profiles?.role === 'admin';
    
  if (targetIsAdmin && comment.user_id !== user.id) {
    throw new Error('You can only delete your own admin comments.');
  }

  const { error: deleteError } = await supabase
    .from('giveaway_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw new Error('Failed to delete comment.');
  }

  revalidatePath(`/giveaways/${giveawayId}`);
}
