'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

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

    // 3. Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: `admin-${session.user.id}-${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });

    const publicUrl = uploadResult.secure_url;

    // 4. Get old avatar to delete
    const supabase = await createServiceClient();
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', session.user.id)
      .single();

    if (oldProfile?.avatar_url) {
      const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
      await deleteCloudinaryImage(oldProfile.avatar_url);
    }

    // 5. Update Profile Table in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);

    if (profileError) throw profileError;

    // 5. Update Auth User Metadata (to reflect across NextAuth sessions)
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
