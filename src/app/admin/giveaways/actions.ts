'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { Giveaway, GiveawaySecret } from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'admin') throw new Error('Unauthorized');
}

export async function fetchAllGiveaways() {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('giveaways')
    .select('*, giveaway_secrets(qr_code_url, credentials)')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  
  // Flatten for UI
  const flattened = data.map(item => {
    const secrets = Array.isArray(item.giveaway_secrets) ? item.giveaway_secrets[0] : item.giveaway_secrets;
    return {
      ...item,
      qr_code_url: secrets?.qr_code_url || '',
      credentials: secrets?.credentials || ''
    };
  });

  return { success: true, data: flattened };
}

export async function addGiveaway(formData: Partial<Giveaway> & Partial<GiveawaySecret>) {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: giveaway, error: insertError } = await supabase
    .from('giveaways')
    .insert([{
      title: formData.title || 'Untitled',
      description: formData.description,
      type: formData.type || 'ACCOUNT',
      is_active: formData.is_active,
      image_url: formData.image_url,
      metadata: formData.metadata
    }])
    .select()
    .single();

  if (insertError) return { success: false, error: insertError.message };

  if (giveaway && (formData.qr_code_url || formData.credentials)) {
    const { error: secretError } = await supabase
      .from('giveaway_secrets')
      .insert([{
        giveaway_id: giveaway.id,
        qr_code_url: formData.qr_code_url,
        credentials: formData.credentials
      }]);
    if (secretError) console.error("Secret Insert Error", secretError);
  }

  revalidatePath('/admin/giveaways');
  revalidatePath('/giveaways');
  return { success: true, data: giveaway };
}

export async function updateGiveaway(id: string, formData: Partial<Giveaway> & Partial<GiveawaySecret>) {
  await requireAdmin();
  const supabase = await createServiceClient();

  const toUpdate: Partial<Giveaway> = {};
  if (formData.title !== undefined) toUpdate.title = formData.title;
  if (formData.description !== undefined) toUpdate.description = formData.description;
  if (formData.type !== undefined) toUpdate.type = formData.type;
  if (formData.is_active !== undefined) toUpdate.is_active = formData.is_active;
  if (formData.image_url !== undefined) toUpdate.image_url = formData.image_url;
  if (formData.metadata !== undefined) toUpdate.metadata = formData.metadata;

  // Delete old image if it's being updated
  if (formData.image_url !== undefined && formData.image_url !== null) {
    const { data: oldGiveaway } = await supabase.from('giveaways').select('image_url').eq('id', id).single();
    if (oldGiveaway?.image_url && oldGiveaway.image_url !== formData.image_url) {
      const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
      await deleteCloudinaryImage(oldGiveaway.image_url);
    }
  }

  if (Object.keys(toUpdate).length > 0) {
    const { error: updateError } = await supabase
      .from('giveaways')
      .update(toUpdate)
      .eq('id', id);

    if (updateError) return { success: false, error: updateError.message };
  }

  if (formData.qr_code_url !== undefined || formData.credentials !== undefined) {
    const { data: existingSecret } = await supabase
      .from('giveaway_secrets')
      .select('giveaway_id')
      .eq('giveaway_id', id)
      .maybeSingle();

    if (existingSecret) {
      // Delete old QR code if it's being updated
      if (formData.qr_code_url !== undefined && formData.qr_code_url !== null) {
        const { data: oldSecret } = await supabase.from('giveaway_secrets').select('qr_code_url').eq('giveaway_id', id).single();
        if (oldSecret?.qr_code_url && oldSecret.qr_code_url !== formData.qr_code_url) {
          const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
          await deleteCloudinaryImage(oldSecret.qr_code_url);
        }
      }

      await supabase
        .from('giveaway_secrets')
        .update({
          qr_code_url: formData.qr_code_url,
          credentials: formData.credentials
        })
        .eq('giveaway_id', id);
    } else {
      await supabase
        .from('giveaway_secrets')
        .insert([{
          giveaway_id: id,
          qr_code_url: formData.qr_code_url,
          credentials: formData.credentials
        }]);
    }
  }

  revalidatePath('/admin/giveaways');
  revalidatePath('/giveaways');
  revalidatePath(`/giveaways/${id}`);
  return { success: true };
}

export async function deleteGiveaway(id: string) {
  await requireAdmin();
  const supabase = await createServiceClient();

  // Delete images from Cloudinary
  const { data: oldGiveaway } = await supabase
    .from('giveaways')
    .select('image_url, giveaway_secrets(qr_code_url)')
    .eq('id', id)
    .single();

  if (oldGiveaway) {
    const { deleteCloudinaryImage } = await import('@/lib/cloudinary');
    if (oldGiveaway.image_url) await deleteCloudinaryImage(oldGiveaway.image_url);
    
    const secrets = Array.isArray(oldGiveaway.giveaway_secrets) 
      ? oldGiveaway.giveaway_secrets[0] 
      : oldGiveaway.giveaway_secrets;
      
    if (secrets?.qr_code_url) await deleteCloudinaryImage(secrets.qr_code_url);
  }

  const { error } = await supabase.from('giveaways').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/giveaways');
  revalidatePath('/giveaways');
  return { success: true };
}
