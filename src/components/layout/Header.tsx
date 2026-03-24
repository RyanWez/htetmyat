'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import styles from './Header.module.css';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/apple-ids', label: 'Apple IDs' },
    { href: '/blog', label: 'Blog' },
  ];

  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>HMA</span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className={styles.actions}>
          <ThemeToggle />

          {session?.user && (
            <div className={styles.userMenu}>
              <button
                className={styles.avatarBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User Menu"
              >
                <div className={styles.avatar}>
                  {session.user.name?.[0]?.toUpperCase() || '?'}
                </div>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{session.user.name}</span>
                    <span className={styles.dropdownEmail}>{session.user.email}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <div className={styles.dropdownDivider} />
                  <button
                    className={styles.dropdownItem}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
