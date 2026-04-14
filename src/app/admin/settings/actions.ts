'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateNameTheme(theme: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const supabase = await createServiceClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ name_theme: theme })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error updating name theme:', error);
    throw new Error('Failed to update theme');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/apple-ids'); // Also revalidate any pages where comments appear
  
  return { success: true };
}

export async function getProfileData() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('name_theme')
    .eq('id', session.user.id)
    .single();

  return data;
}

export async function updateSystemSettings(data: {
  maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_end_time: string | null;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, ...data });

  if (error) {
    console.error('Error updating system settings:', error);
    throw new Error('Failed to update system settings');
  }
  
  revalidateTag('site_settings', 'default');
  revalidatePath('/', 'layout');

  return { success: true };
}
