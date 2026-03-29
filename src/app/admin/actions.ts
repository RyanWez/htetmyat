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
  
  // Get logs for the last 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('created_at, user_id, metadata')
    .gte('created_at', yesterday.toISOString());

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  // Aggregate by 2-hour blocks
  const result = [];
  for (let i = 0; i < 12; i++) {
    const hourStart = (i * 2);
    const label = `${hourStart}:00`;
    
    // Filter logs in this 2-hour block
    const inBlock = logs?.filter(l => {
      const d = new Date(l.created_at);
      return d.getHours() >= hourStart && d.getHours() < hourStart + 2;
    }) || [];

    // Count UNIQUE users (logged in)
    const uniqueLoggedUsers = new Set(
      inBlock.filter(l => l.user_id).map(l => l.user_id)
    ).size;

    // Count UNIQUE guests (using simple session/IP from metadata if available, otherwise fallback)
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

  // Get logs for the last 7 days
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('created_at, user_id, metadata')
    .gte('created_at', lastWeek.toISOString());

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const results = [];
  
  // Create last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    const dayName = days[targetDate.getDay()];
    
    const dayLogs = logs?.filter(l => {
      const d = new Date(l.created_at);
      return d.toDateString() === targetDate.toDateString();
    }) || [];

    results.push({
      name: dayName,
      weekly: new Set(dayLogs.filter(l => l.user_id).map(l => l.user_id)).size,
      nonLogin: new Set(dayLogs.filter(l => !l.user_id).map(l => (l.metadata as ActivityMetadata)?.userAgent || Math.random())).size
    });
  }

  return results;
}
