'use server';

import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Check if an account is suspended before proceeding with login.
 * Uses service_role to bypass RLS and check profiles table.
 */
export async function checkAccountStatus(email: string): Promise<{
  isSuspended: boolean;
  error?: string;
}> {
  if (!email) {
    return { isSuspended: false };
  }

  try {
    const supabase = getServiceClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      // Profile not found — might be wrong email, don't reveal that
      return { isSuspended: false };
    }

    if (profile && profile.is_active === false) {
      return { isSuspended: true };
    }

    return { isSuspended: false };
  } catch {
    return { isSuspended: false };
  }
}

/**
 * Check if a device can log in for a given email (device limit check).
 * Called BEFORE signIn to prevent unauthorized sessions.
 */
export async function checkDeviceLimitByEmail(
  email: string,
  deviceFingerprint: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!email || !deviceFingerprint) {
    return { allowed: true };
  }

  try {
    const supabase = getServiceClient();

    // Look up user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, max_devices')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!profile) {
      // User not found — let signIn handle it
      return { allowed: true };
    }

    const userId = profile.id;

    // Check if this device is already registered for this user
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (existingDevice) {
      // Device already registered — allowed
      return { allowed: true };
    }

    // Get global default from site_settings
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('max_devices_default')
      .eq('id', 1)
      .single();

    const maxDevices = profile.max_devices ?? siteSettings?.max_devices_default ?? 1;

    // Count current registered devices
    const { count } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;

    if (currentCount >= maxDevices) {
      return {
        allowed: false,
        reason: 'DEVICE_LIMIT_REACHED',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Device limit check error:', err);
    // On error, allow login to avoid false lockouts
    return { allowed: true };
  }
}

/**
 * Register or update a device for a user after successful login.
 * Uses email to look up the user since we don't have userId on the client.
 */
export async function registerDeviceByEmail(
  email: string,
  deviceFingerprint: string,
  deviceName: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || !deviceFingerprint) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const supabase = getServiceClient();

    // Look up user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    // Upsert — if device exists, update last_used_at; if new, insert
    const { error } = await supabase
      .from('user_devices')
      .upsert(
        {
          user_id: profile.id,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,device_fingerprint',
        }
      );

    if (error) {
      console.error('Device registration error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Device registration error:', err);
    return { success: false, error: 'Failed to register device' };
  }
}
