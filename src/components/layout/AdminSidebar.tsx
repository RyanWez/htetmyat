'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/apple-ids', label: 'Apple IDs', icon: '🍎' },
  { href: '/admin/posts', label: 'Blog Posts', icon: '📝' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/reports', label: 'Reports', icon: '⚠️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <Link href="/admin" className={styles.logo}>
        <span className={styles.logoIcon}>◉</span>
        <span className={styles.logoText}>HMA</span>
        <span className={styles.adminBadge}>Admin</span>
      </Link>

      {/* Navigation */}
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Back to Site + Logout */}
      <div className={styles.footer}>
        <Link href="/" className={styles.navItem}>
          <span className={styles.navIcon}>🌐</span>
          <span className={styles.navLabel}>Back to Site</span>
        </Link>
        <button
          className={styles.navItem}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <span className={styles.navIcon}>🚪</span>
          <span className={styles.navLabel}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
