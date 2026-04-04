'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

interface ActivityMetadata {
  path?: string;
  userAgent?: string;
  [key: string]: unknown;
}

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

export async function getUserActivityStats() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const supabase = await createServiceClient();
  
  const MMT_OFFSET = 6.5 * 60 * 60 * 1000; // 6.5 hours in milliseconds
  
  // Get start of today (Midnight in Myanmar Time)
  const now = new Date();
  const nowMmt = new Date(now.getTime() + MMT_OFFSET);
  nowMmt.setUTCHours(0, 0, 0, 0);
  const startOfDayUtc = new Date(nowMmt.getTime() - MMT_OFFSET);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('created_at, user_id, metadata')
    .gte('created_at', startOfDayUtc.toISOString());

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  // Aggregate by 2-hour blocks (Myanmar Time)
  const result = [];

  for (let i = 0; i < 12; i++) {
    const hourStart = (i * 2);
    const label = `${hourStart}:00`;
    
    // Filter logs in this 2-hour block (Converted to Myanmar Time)
    const inBlock = logs?.filter(l => {
      const utcDate = new Date(l.created_at);
      const mmtDate = new Date(utcDate.getTime() + MMT_OFFSET);
      const mmtHour = mmtDate.getUTCHours(); // Get hour in +6:30
      
      return mmtHour >= hourStart && mmtHour < hourStart + 2;
    }) || [];

    // Count UNIQUE users (logged in)
    const uniqueLoggedUsers = new Set(
      inBlock.filter(l => l.user_id).map(l => l.user_id)
    ).size;

    // Count UNIQUE guests
    const uniqueGuests = new Set(
      inBlock.filter(l => !l.user_id).map(l => (l.metadata as ActivityMetadata)?.path || Math.random())
    ).size;

    result.push({
      name: label,
      daily: uniqueLoggedUsers,
      nonLogin: uniqueGuests
    });
  }

  return result;
}

export async function getWeeklyActivityStats() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const supabase = await createServiceClient();

  // Professional approach: Let PostgreSQL handle timezone-aware aggregation
  // The RPC function uses Asia/Yangon timezone and generate_series to produce
  // exactly 7 days ending with today, with proper LEFT JOIN for zero-fill
  const { data, error } = await supabase.rpc('get_weekly_activity_stats');

  if (error) {
    console.error('Error fetching weekly stats:', error);
    return [];
  }

  return (data || []).map((row: { day_name: string; weekly_users: number; non_login: number }) => ({
    name: row.day_name,
    weekly: row.weekly_users,
    nonLogin: row.non_login,
  }));
}
