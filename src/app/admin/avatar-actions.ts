'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

/**
 * Upload an admin avatar, optimize it, and update the profiles table.
 * Supports: GIF, JPG, PNG, WEBP
 */
export async function uploadAdminAvatar(formData: FormData) {
  try {
    // 1. Verify Authentication & Role
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    
    if (!session?.user?.id || role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const file = formData.get('avatar') as File;
    if (!file) {
      throw new Error('No image file selected');
    }

    // Check size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large (max 5MB)');
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    const contentType = file.type;
    const isGif = contentType === 'image/gif';

    // 2. Optimization with Sharp
    const sharpInstance = sharp(buffer, { animated: isGif });
    
    if (isGif) {
      // GIFs: Keep animations, just resize to medium size
      const optimized = await sharpInstance
        .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
        .gif() 
        .toBuffer();
      buffer = Buffer.from(optimized);
    } else {
      // Other formats: Convert to high quality WebP for best optimization
      const optimized = await sharpInstance
        .resize({ width: 400, height: 400, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
      buffer = Buffer.from(optimized);
    }

    // 3. Upload to Supabase Storage
    const supabase = await createServiceClient();
    
    // Ensure the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === 'avatars')) {
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (createError) throw createError;
    }

    const fileExt = isGif ? 'gif' : 'webp';
    const filePath = `admin-${session.user.id}-${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: isGif ? 'image/gif' : 'image/webp',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path);

    // 5. Update Profile Table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);

    if (profileError) throw profileError;

    // 6. Update Auth User Metadata (to reflect across NextAuth sessions)
    await supabase.auth.admin.updateUserById(session.user.id, {
      user_metadata: { avatar_url: publicUrl }
    });

    revalidatePath('/admin');
    revalidatePath('/profile');
    
    return { success: true, url: publicUrl };

  } catch (err) {
    const error = err as Error;
    console.error('Avatar upload error:', error);
    return { success: false, error: error.message || 'Failed to upload avatar' };
  }
}
