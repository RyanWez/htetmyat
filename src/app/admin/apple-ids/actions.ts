'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { AppleId } from '@/lib/supabase/types';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
    const { error } = await supabase.from('apple_ids').update(data).eq('id', id);
    
    if (error) throw error;
    
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

    const supabase = await createServiceClient();
    
    // Generate safe filename
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { error: uploadError } = await supabase.storage
      .from('apple_ids')
      .upload(fileName, buffer, {
        contentType: file.type,
      });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('apple_ids')
      .getPublicUrl(fileName);
      
    return { success: true, url: publicUrl };
  } catch (err) {
    const error = err as Error;
    console.error('Upload Error:', error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}
