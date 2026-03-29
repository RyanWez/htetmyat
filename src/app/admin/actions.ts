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

  // Aggregate by 2-hour blocks (Myanmar Time)
  const result = [];
  const MMT_OFFSET = 6.5 * 60 * 60 * 1000; // 6.5 hours in milliseconds

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
  const MMT_OFFSET = 6.5 * 60 * 60 * 1000;
  
  // Create last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    
    // Normalize targetDate to Myanmar Time Date String
    const targetMmtDate = new Date(targetDate.getTime() + MMT_OFFSET);
    const targetDayString = targetMmtDate.getUTCDate();
    const targetMonthString = targetMmtDate.getUTCMonth();
    const dayName = days[targetMmtDate.getUTCDay()];
    
    const dayLogs = logs?.filter(l => {
      const logUtcDate = new Date(l.created_at);
      const logMmtDate = new Date(logUtcDate.getTime() + MMT_OFFSET);
      return logMmtDate.getUTCDate() === targetDayString && 
             logMmtDate.getUTCMonth() === targetMonthString;
    }) || [];

    results.push({
      name: dayName,
      weekly: new Set(dayLogs.filter(l => l.user_id).map(l => l.user_id)).size,
      nonLogin: new Set(dayLogs.filter(l => !l.user_id).map(l => (l.metadata as ActivityMetadata)?.userAgent || Math.random())).size
    });
  }

  return results;
}
