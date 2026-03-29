'use server';

import { createClient } from '@supabase/supabase-js';

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
