'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be logged in');
  }
  return session.user;
}

export async function fetchMyProfile() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createServiceClient();

    // 1. Try to fetch profile
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    let profile = result.data;
    const error = result.error;

    // 2. If profile doesn't exist (PGRST116), create it on the fly
    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          display_name: user.name || user.email?.split('@')[0],
          role: user.role as 'admin'|'user',
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      profile = newProfile;
    } else if (error) {
      throw error;
    }

    // 3. Get auth data for last_sign_in_at
    const { data: authData } = await supabase.auth.admin.getUserById(user.id);

    return {
      success: true,
      data: {
        ...profile,
        last_sign_in_at: authData?.user?.last_sign_in_at,
      },
    };
  } catch (err) {
    const error = err as Error;
    console.error('Error fetching profile:', error);
    return { success: false, data: null, error: error.message || 'Failed to fetch profile' };
  }
}

export async function updateDisplayName(displayName: string) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createServiceClient();

    const trimmed = displayName.trim();
    if (!trimmed) throw new Error('Display name cannot be empty');
    if (trimmed.length > 50) throw new Error('Display name must be 50 characters or less');

    // Check role — Admin is always exempt from rate limiting
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, display_name_changed_at')
      .eq('id', user.id)
      .single();

    if (profile && profile.role !== 'admin' && profile.display_name_changed_at) {
      const lastChanged = new Date(profile.display_name_changed_at);
      const now = new Date();
      const diffMs = now.getTime() - lastChanged.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const COOLDOWN_DAYS = 7;

      if (diffDays < COOLDOWN_DAYS) {
        const remainingDays = Math.ceil(COOLDOWN_DAYS - diffDays);
        throw new Error(
          `You can only change your display name once every 7 days. Please wait ${remainingDays} more day${remainingDays > 1 ? 's' : ''}.`
        );
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: trimmed,
        display_name_changed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    // Also update auth user metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { display_name: trimmed },
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    const error = err as Error;
    // Only log unexpected errors, not rate-limit business logic
    if (!error.message?.includes('once every 7 days')) {
      console.error('Error updating display name:', error);
    }
    return { success: false, error: error.message || 'Failed to update display name' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!currentPassword || !newPassword) {
      throw new Error('Both current and new passwords are required');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    // Verify current password by attempting to sign in
    const { createClient } = await import('@supabase/supabase-js');
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      throw new Error('Current password is incorrect');
    }

    // Update password using service client
    const supabase = await createServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(user.id!, {
      password: newPassword,
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error changing password:', error);
    return { success: false, error: error.message || 'Failed to change password' };
  }
}
