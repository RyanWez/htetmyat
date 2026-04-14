'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import AppleIcon from '@/components/AppleIcon';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalIds: number;
  activeIds: number;
  inactiveIds: number;
  totalPosts: number;
}

interface ChartData {
  name: string;
  daily?: number;
  weekly?: number;
  nonLogin: number;
}

interface DashboardClientProps {
  stats: DashboardStats;
  chartData: {
    daily: ChartData[];
    weekly: ChartData[];
  };
}

export default function DashboardClient({ stats, chartData }: DashboardClientProps) {
  const [chartType, setChartType] = useState<'daily' | 'weekly'>('daily');

  const currentChartData = chartType === 'daily' ? chartData.daily : chartData.weekly;

  const statCards = [
    { label: 'Total IDs', value: stats.totalIds, icon: <AppleIcon />, color: 'var(--brand-primary)' },
    { label: 'Active IDs', value: stats.activeIds, icon: '✅', color: 'var(--accent-success)' },
    { label: 'Inactive IDs', value: stats.inactiveIds, icon: '⚠️', color: 'var(--accent-warning)' },
    { label: 'Blog Posts', value: stats.totalPosts, icon: '📰', color: 'var(--accent-info)' },
  ];

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className={styles.pageTitle}>Admin Dashboard</h1>
        <p className={styles.pageDesc}>Welcome back! Overview of your platform performance.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.statCard}
            style={{ '--card-color': stat.color } as React.CSSProperties}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
          >
            <div className={styles.statHeader}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statIcon}>{stat.icon}</div>
            </div>
            <div className={styles.statValue} style={{ color: stat.color }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart Section */}
      <motion.div
        className={`glass-card ${styles.chartSection}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className={styles.chartScroll}>
          <div className={styles.chartHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>User Activity</h2>
            <div className={styles.chartToggles}>
              <button 
                className={`${styles.chartToggle} ${chartType === 'daily' ? styles.chartToggleActive : ''}`}
                onClick={() => setChartType('daily')}
              >
                Daily
              </button>
              <button 
                className={`${styles.chartToggle} ${chartType === 'weekly' ? styles.chartToggleActive : ''}`}
                onClick={() => setChartType('weekly')}
              >
                Weekly
              </button>
            </div>
          </div>
          
          <div className={styles.chartContainer} style={{ minWidth: (typeof window !== 'undefined' && window.innerWidth < 640) ? '600px' : '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNonLogin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--text-tertiary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--text-tertiary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface-solid)', 
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ fontSize: 12, fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey={chartType === 'daily' ? 'daily' : 'weekly'}
                  name={chartType === 'daily' ? 'Active Users' : 'Weekly Visitors'}
                  stroke="var(--brand-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="nonLogin"
                  name="Not Logged In"
                  stroke="var(--text-tertiary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNonLogin)"
                  animationDuration={1500}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className={styles.section}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className={styles.sectionTitle}>Quick Access</h2>
        <div className={styles.quickActions}>
          <Link href="/admin/apple-ids" className={`glass-card ${styles.actionCard}`}>
            <div className={styles.actionIcon}><AppleIcon /></div>
            <div className={styles.actionLabel}>Manage Apple IDs</div>
          </Link>
          <Link href="/admin/posts" className={`glass-card ${styles.actionCard}`}>
            <div className={styles.actionIcon}>📝</div>
            <div className={styles.actionLabel}>Manage Content</div>
          </Link>
          <Link href="/admin/users" className={`glass-card ${styles.actionCard}`}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionLabel}>User Access</div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
