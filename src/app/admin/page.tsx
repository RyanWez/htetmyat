import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getDashboardStats, getUserActivityStats, getWeeklyActivityStats } from './actions';

// Lazy-load DashboardClient to code-split recharts (~200KB) out of the main bundle.
// Recharts is only needed on this admin page — no reason to ship it to every user.
const DashboardClient = dynamic(() => import('./dashboard-client'), {
  loading: () => (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
      <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 16px' }} />
      <p>Loading Dashboard...</p>
    </div>
  ),
});

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
