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
      .order('created_at', { ascending: false });
    
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
