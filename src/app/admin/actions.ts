'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export async function getDashboardStats() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const supabase = await createServiceClient();

  const [idsResult, postsResult] = await Promise.all([
    supabase.from('apple_ids').select('is_active'),
    supabase.from('posts').select('id', { count: 'exact' }),
  ]);

  const ids = idsResult.data || [];
  const activeIds = ids.filter((id) => id.is_active).length;

  return {
    totalIds: ids.length,
    activeIds,
    inactiveIds: ids.length - activeIds,
    totalPosts: postsResult.count || 0,
  };
}
