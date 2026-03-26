'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppleIcon from '@/components/AppleIcon';
import styles from './AdminSidebar.module.css';

type SubItem = {
  href: string;
  label: string;
  icon: React.ReactNode | string;
};

type MenuItem = {
  href?: string;
  label: string;
  icon: React.ReactNode | string;
  subItems?: SubItem[];
};

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/apple-ids', label: 'Apple IDs', icon: <AppleIcon /> },
  { href: '/admin/posts', label: 'Blog Posts', icon: '📝' },
  { 
    label: 'User Management', 
    icon: '👥',
    subItems: [
      { href: '/admin/users', label: 'User List', icon: '📋' },
    ]
  },
  { href: '/admin/reports', label: 'Reports', icon: '⚠️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Open the parent menu if a child is active initially
  useEffect(() => {
    const newOpenMenus = { ...openMenus };
    let hasChanges = false;
    menuItems.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(sub => pathname.startsWith(sub.href));
        if (hasActiveChild && !newOpenMenus[item.label]) {
          newOpenMenus[item.label] = true;
          hasChanges = true;
        }
      }
    });
    if (hasChanges) setOpenMenus(newOpenMenus);
  }, [pathname]);

  const toggleSubMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <Link href="/admin" className={styles.mobileLogo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>HMA</span>
          <span className={styles.adminBadge}>Admin</span>
        </Link>
        <button 
          className={styles.mobileToggle}
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          {/* Logo */}
          <Link href="/admin" className={styles.logo}>
            <span className={styles.logoIcon}>◉</span>
            <span className={styles.logoText}>HMA</span>
            <span className={styles.adminBadge}>Admin</span>
          </Link>
          <button 
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            if (item.subItems) {
              const menuOpen = openMenus[item.label];
              const isChildActive = item.subItems.some(sub => pathname.startsWith(sub.href));
              
              return (
                <div key={item.label} className={styles.navGroup}>
                  <button 
                    onClick={() => toggleSubMenu(item.label)}
                    className={`${styles.navItem} ${isChildActive ? styles.navGroupActive : ''}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.chevron} style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                      ▼
                    </span>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={styles.subMenu}
                      >
                        {item.subItems.map(subItem => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`${styles.subNavItem} ${isSubActive ? styles.subNavItemActive : ''}`}
                            >
                              <span className={styles.navIcon}>{subItem.icon}</span>
                              <span className={styles.navLabel}>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href as string);
            return (
              <Link
                key={item.href}
                href={item.href as string}
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
    </>
  );
}
