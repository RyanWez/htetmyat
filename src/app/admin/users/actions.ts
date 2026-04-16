'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function fetchAllUsers() {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();
    
    const { data: profiles, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('email', 'admin@appleid.com') // Hide specific manual admin account
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: profiles || [], count: count || 0 };
  } catch (err) {
    const error = err as Error;
    console.error('Error fetching users:', error);
    return { success: false, data: [], error: error.message || 'Failed to fetch users' };
  }
}

export async function createUserAction(formData: FormData) {
  try {
    await verifyAdmin();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'user';

    if (!email || !password) throw new Error('Email and password are required');

    const supabase = await createServiceClient();

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name: email.split('@')[0] }
    });

    if (authError) throw authError;

    // Check if profile was auto-created by trigger; if not, create or update it
    if (authData.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();
        
      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          display_name: email.split('@')[0],
        });
      } else {
        await supabase.from('profiles').update({ role }).eq('id', authData.user.id);
      }
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error creating user:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

export async function fetchUserById(id: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    // 1. Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) throw profileError;

    // 2. Get auth data for last_sign_in_at
    const { data: auth } = await supabase.auth.admin.getUserById(id);
    
    return { 
      success: true, 
      data: { 
        ...profile, 
        last_sign_in_at: auth?.user?.last_sign_in_at 
      } 
    };
  } catch (err) {
    const error = err as Error;
    if ((error as { code?: string }).code !== 'PGRST116') {
      console.error('Error fetching user:', error);
    }
    return { success: false, data: null, error: error.message || 'Failed to fetch user' };
  }
}

export async function updateUserRole(id: string, role: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;

    await supabase.auth.admin.updateUserById(id, { user_metadata: { role } });

    revalidatePath(`/admin/users/${id}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error updating role:', error);
    return { success: false, error: error.message || 'Failed to update user role' };
  }
}

export async function updateUserStatus(id: string, isActive: boolean) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error: profileError } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id);
    if (profileError) throw profileError;

    if (!isActive) {
      await supabase.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    } else {
      await supabase.auth.admin.updateUserById(id, { ban_duration: 'none' });
    }

    revalidatePath(`/admin/users/${id}`);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error updating status:', error);
    return { success: false, error: error.message || 'Failed to update user status' };
  }
}

export async function updateUserPassword(id: string, newPassword: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase.auth.admin.updateUserById(id, { password: newPassword });
    if (error) throw error;

    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error updating password:', error);
    return { success: false, error: error.message || 'Failed to update password' };
  }
}

export async function deleteUser(id: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    await supabase.from('profiles').delete().eq('id', id);

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}

// ==========================================
// Device Management Actions
// ==========================================

export async function fetchUserDevices(userId: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: devices || [] };
  } catch (err) {
    const error = err as Error;
    console.error('Error fetching user devices:', error);
    return { success: false, data: [], error: error.message || 'Failed to fetch devices' };
  }
}

export async function removeDevice(deviceId: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error removing device:', error);
    return { success: false, error: error.message || 'Failed to remove device' };
  }
}

export async function removeAllDevices(userId: string) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error removing all devices:', error);
    return { success: false, error: error.message || 'Failed to remove all devices' };
  }
}

export async function updateMaxDevices(userId: string, maxDevices: number | null) {
  try {
    await verifyAdmin();
    const supabase = await createServiceClient();

    const { error } = await supabase
      .from('profiles')
      .update({ max_devices: maxDevices })
      .eq('id', userId);

    if (error) throw error;

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error('Error updating max devices:', error);
    return { success: false, error: error.message || 'Failed to update device limit' };
  }
}
