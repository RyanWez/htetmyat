'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateNameTheme(theme: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createServiceClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ name_theme: theme })
    .eq('id', session.user.id);

  if (error) {
    console.error('Error updating name theme:', error);
    return { success: false, error: 'Failed to update theme' };
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
  max_devices_default: number;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  const supabase = await createServiceClient();
  
  // Get current settings to detect if device limit is changing
  const { data: currentSettings } = await supabase
    .from('site_settings')
    .select('max_devices_default')
    .eq('id', 1)
    .single();

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, ...data });

  if (error) {
    console.error('Error updating system settings:', error);
    return { success: false, error: 'Failed to update system settings' };
  }

  // If the device limit was changed, enforce a global reset ONLY on typical users
  if (currentSettings && currentSettings.max_devices_default !== data.max_devices_default) {
    console.log(`Global device limit changed from ${currentSettings.max_devices_default} to ${data.max_devices_default}. Resetting global users...`);
    
    // Fetch users who do NOT have a custom override (they follow the global limit)
    const { data: standardProfiles } = await supabase
      .from('profiles')
      .select('id')
      .is('max_devices', null);

    if (standardProfiles && standardProfiles.length > 0) {
      const standardUserIds = standardProfiles.map(p => p.id);
      
      // Get all devices associated with these standard users
      const { data: allDevices } = await supabase
        .from('user_devices')
        .select('user_id')
        .in('user_id', standardUserIds);

      if (allDevices && allDevices.length > 0) {
        // Tally up how many devices each user has
        const userDeviceCounts: Record<string, number> = {};
        for (const device of allDevices) {
          userDeviceCounts[device.user_id] = (userDeviceCounts[device.user_id] || 0) + 1;
        }

        // Identify users who EXCEED the NEW limit
        const violatingUserIds = Object.keys(userDeviceCounts).filter(
          userId => userDeviceCounts[userId] > data.max_devices_default
        );

        if (violatingUserIds.length > 0) {
          console.log(`Wiping devices for ${violatingUserIds.length} users who exceeded the new limit of ${data.max_devices_default}`);
          
          // Delete devices ONLY for violating users, forcing them to log out and re-register under the new rules
          await supabase
            .from('user_devices')
            .delete()
            .in('user_id', violatingUserIds);
        }
      }
    }
  }
  
  revalidateTag('site_settings', 'default');
  revalidatePath('/', 'layout');

  return { success: true };
}
