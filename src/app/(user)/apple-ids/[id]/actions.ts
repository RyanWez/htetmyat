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
  
  const apple_id = formData.get('apple_id') as string;
  const comment_text = formData.get('comment_text') as string;
  const parent_id = formData.get('parent_id') as string || null;

  if (!apple_id || !comment_text) {
    throw new Error('Missing fields');
  }

  if (comment_text.length > 150) {
    throw new Error('Comment must be 150 characters or less.');
  }

  const { error } = await supabase
    .from('apple_id_comments')
    .insert([
      { apple_id, comment_text, parent_id, user_id: user.id }
    ]);

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Comment ထည့်သွင်းခြင်း မအောင်မြင်ပါ။');
  }

  // --- Comment Notification System ---
  try {
    // 1. Get commenter's display name and apple ID title in parallel
    const [commenterResult, appleIdResult] = await Promise.all([
      supabase.from('profiles').select('display_name, role').eq('id', user.id).single(),
      supabase.from('apple_ids').select('title').eq('id', apple_id).single()
    ]);

    const commenterName = commenterResult.data?.display_name || 'Someone';
    const appleTitle = appleIdResult.data?.title || 'Apple ID';
    const notiLink = `/apple-ids/${apple_id}`;
    const truncatedComment = comment_text.length > 50 
      ? comment_text.substring(0, 50) + '...' 
      : comment_text;

    const notificationsToInsert: Array<{
      title: string; message: string; link: string; type: string; user_id: string;
    }> = [];

    // 2. Notify ALL admins (except the commenter themselves if they are an admin)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .neq('id', user.id);

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        notificationsToInsert.push({
          title: `💬 New Comment on "${appleTitle}"`,
          message: `${commenterName}: "${truncatedComment}"`,
          link: notiLink,
          type: 'personal',
          user_id: admin.id
        });
      }
    }

    // 3. If this is a Reply → also notify the parent comment's author
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from('apple_id_comments')
        .select('user_id, profiles(display_name)')
        .eq('id', parent_id)
        .single();

      if (parentComment && parentComment.user_id !== user.id) {
        // Check if we already added a notification for this user (e.g. they're an admin)
        const alreadyNotified = notificationsToInsert.some(n => n.user_id === parentComment.user_id);
        if (!alreadyNotified) {
          notificationsToInsert.push({
            title: `↩️ ${commenterName} replied to your comment`,
            message: `"${truncatedComment}" — on "${appleTitle}"`,
            link: notiLink,
            type: 'personal',
            user_id: parentComment.user_id
          });
        }
      }
    }

    // 4. Batch insert all notifications at once (efficient)
    if (notificationsToInsert.length > 0) {
      await supabase.from('notifications').insert(notificationsToInsert);

      // 5. Send Web Push to all notified users' devices
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`;

      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

        // Collect all user IDs that need push
        const targetUserIds = notificationsToInsert.map(n => n.user_id);

        // Fetch their push subscriptions in one query
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', targetUserIds);

        if (subs && subs.length > 0) {
          // Map user_id → notification for personalized push content
          const notiByUser = new Map(notificationsToInsert.map(n => [n.user_id, n]));

          await Promise.allSettled(subs.map(sub => {
            const noti = notiByUser.get(sub.user_id);
            const pushPayload = JSON.stringify({
              title: noti?.title || `💬 New Comment on "${appleTitle}"`,
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
    // Notification errors should never block the comment from being saved
    console.error('Comment notification error (non-blocking):', notiErr);
  }

  revalidatePath(`/apple-ids/${apple_id}`);
}

export async function deleteComment(commentId: string, appleId: string) {
  const session = await auth();
  const user = session?.user;
  
  if (!user || user.role !== 'admin') {
    throw new Error('Only admins can delete comments.');
  }

  const supabase = await createServiceClient();

  // Fetch the comment to check who owns it
  const { data: comment, error: fetchError } = await supabase
    .from('apple_id_comments')
    .select('*, profiles(role)')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    throw new Error('Comment not found.');
  }

  // Logic: 
  // 1. If target is a User comment -> Any Admin can delete.
  // 2. If target is an Admin comment -> Only the author Admin can delete.
  const targetIsAdmin = comment.profiles?.role === 'admin';
  if (targetIsAdmin && comment.user_id !== user.id) {
    throw new Error('You can only delete your own admin comments.');
  }

  const { error: deleteError } = await supabase
    .from('apple_id_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw new Error('Failed to delete comment.');
  }

  revalidatePath(`/apple-ids/${appleId}`);
}

export async function getAppleIdData(id: string) {
  const supabase = await createServiceClient();
  
  const [appleResponse, commentsResponse] = await Promise.all([
    supabase
      .from('apple_ids')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('apple_id_comments')
      .select('*, profiles(display_name, avatar_url, role, name_theme)')
      .eq('apple_id', id)
      .order('created_at', { ascending: true })
  ]);

  if (appleResponse.error) throw new Error(appleResponse.error.message);
  if (commentsResponse.error) throw new Error(commentsResponse.error.message);

  return {
    appleId: appleResponse.data,
    comments: commentsResponse.data
  };
}
