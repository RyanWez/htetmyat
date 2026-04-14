import { Metadata } from 'next';
import DashboardClient from './dashboard-client';
import { getDashboardStats, getUserActivityStats, getWeeklyActivityStats } from './actions';

export const metadata: Metadata = {
  title: 'Admin Dashboard - HMA',
};

// Next.js uses revalidate = 0 to denote no cache (equivalent to force-dynamic but more standard for app router data fetching edges)
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // Fetch all data in parallel on the server during the initial render request
  const [stats, dailyRes, weeklyRes] = await Promise.all([
    getDashboardStats(),
    getUserActivityStats(),
    getWeeklyActivityStats(),
  ]);

  const chartData = {
    daily: dailyRes,
    weekly: weeklyRes,
  };

  return <DashboardClient stats={stats} chartData={chartData} />;
}
