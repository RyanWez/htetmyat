'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AppleIcon from '@/components/AppleIcon';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalIds: number;
  activeIds: number;
  inactiveIds: number;
  totalPosts: number;
}



interface DashboardClientProps {
  stats: DashboardStats;
}

export default function DashboardClient({ stats }: DashboardClientProps) {
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
