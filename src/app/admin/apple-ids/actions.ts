'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { AppleId } from '@/lib/supabase/types';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';
// Helper to verify admin access
async function verifyAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function fetchAllAppleIds() {
  await verifyAdmin();
  
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('apple_ids')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Error fetching Apple IDs:', err);
    return { success: false, data: [], error: 'Failed to fetch Apple IDs' };
  }
}

export async function addAppleId(data: Omit<AppleId, 'id' | 'created_at' | 'updated_at'>) {
  await verifyAdmin();
  
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from('apple_ids').insert(data);
    
    if (error) throw error;
    
    revalidatePath('/admin/apple-ids');
    revalidatePath('/apple-ids');
    return { success: true };
  } catch (err) {
    console.error('Error adding Apple ID:', err);
    return { success: false, error: 'Failed to add Apple ID' };
  }
}

export async function updateAppleId(id: string, data: Partial<Omit<AppleId, 'id' | 'created_at' | 'updated_at'>>) {
  await verifyAdmin();
  
  try {
    const supabase = await createServiceClient();

    // Check if images are being updated to clean up Cloudinary
    if (data.images !== undefined) {
      const { data: oldAppleId } = await supabase.from('apple_ids').select('images').eq('id', id).single();
      if (oldAppleId?.images) {
        const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
        const newImages = data.images || [];
        const imagesToDelete = oldAppleId.images.filter((img: string) => !newImages.includes(img));
        if (imagesToDelete.length > 0) {
          await Promise.allSettled(imagesToDelete.map((img: string) => deleteCloudinaryImage(img)));
        }
      }
    }

    const { error } = await supabase.from('apple_ids').update(data).eq('id', id);
    
    if (error) throw error;
    
    // Trigger push notification if the ID was just marked active
    if (data.is_active === true) {
      try {
        const { data: updatedId } = await supabase.from('apple_ids').select('title').eq('id', id).single();
        const appleIdTitle = updatedId?.title || 'an Apple ID';

        // 1. In-App Notification Flow
        const { data: template } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('name', 'apple_id_active')
          .single();

        let notiTitle = 'Apple ID is Active! 🎉';
        let notiMessage = `The Apple ID "${appleIdTitle}" is now active and ready to use.`;

        if (template) {
          notiTitle = template.title_template.replace(/\{\{title\}\}/g, appleIdTitle);
          notiMessage = template.message_template.replace(/\{\{title\}\}/g, appleIdTitle);
        }

        await supabase.from('notifications').insert({
          title: notiTitle,
          message: notiMessage,
          link: `/apple-ids/${id}`,
          type: 'global'
        });

        // 2. Web Push Notification Flow (Old logic)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
        const subject = `mailto:${process.env.ADMIN_EMAIL || 'admin@example.com'}`;
        
        if (vapidPublicKey && vapidPrivateKey) {
          webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
          
          const { data: subs, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('*');
            
          if (!subsError && subs && subs.length > 0) {
            const payload = JSON.stringify({
              title: notiTitle,
              body: notiMessage,
              data: { url: `/apple-ids/${id}` }
            });

            await Promise.allSettled(subs.map(sub => {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              };
              return webpush.sendNotification(pushSubscription, payload);
            }));
          }
        }
      } catch (pushErr) {
        console.error('Failed to send notifications:', pushErr);
      }
    }
    
    revalidatePath('/admin/apple-ids');
    revalidatePath('/apple-ids');
    return { success: true };
  } catch (err) {
    console.error('Error updating Apple ID:', err);
    return { success: false, error: 'Failed to update Apple ID' };
  }
}

export async function deleteAppleId(id: string) {
  await verifyAdmin();
  
  try {
    const supabase = await createServiceClient();

    // Delete images from Cloudinary
    const { data: oldAppleId } = await supabase.from('apple_ids').select('images').eq('id', id).single();
    if (oldAppleId?.images && oldAppleId.images.length > 0) {
      const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
      await Promise.allSettled(oldAppleId.images.map((img: string) => deleteCloudinaryImage(img)));
    }

    const { error } = await supabase.from('apple_ids').delete().eq('id', id);
    
    if (error) throw error;
    
    revalidatePath('/admin/apple-ids');
    revalidatePath('/apple-ids');
    return { success: true };
  } catch (err) {
    console.error('Error deleting Apple ID:', err);
    return { success: false, error: 'Failed to delete Apple ID' };
  }
}

export async function uploadAppleIdImage(formData: FormData) {
  try {
    await verifyAdmin();
    
    const file = formData.get('file') as File | null;
    if (!file) return { success: false, error: 'No file provided' };

    // Generate safe filename
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'apple_ids',
          public_id: fileName,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });
      
    return { success: true, url: uploadResult.secure_url };
  } catch (err) {
    const error = err as Error;
    console.error('Upload Error:', error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}
