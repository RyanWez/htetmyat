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
    .select('created_at, user_id')
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
    
    // Count logic
    const inBlock = logs?.filter(l => {
      const d = new Date(l.created_at);
      return d.getHours() >= hourStart && d.getHours() < hourStart + 2;
    }) || [];

    result.push({
      name: label,
      daily: inBlock.filter(l => l.user_id).length,
      nonLogin: inBlock.filter(l => !l.user_id).length
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
    .select('created_at, user_id')
    .gte('created_at', lastWeek.toISOString());

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  
  return days.map((day, idx) => {
    // Correct day alignment (mocking day logic for simplicity, in production would use date index)
    const filtered = logs?.filter(l => {
      const d = new Date(l.created_at);
      // This is a simple day-of-week match
      return d.getDay() === (idx + 1) % 7; 
    }) || [];

    return {
      name: day,
      weekly: filtered.filter(l => l.user_id).length,
      nonLogin: filtered.filter(l => !l.user_id).length
    };
  });
}
