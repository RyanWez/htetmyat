'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import styles from './Header.module.css';
import ThemeToggle from '@/components/ui/ThemeToggle';

function HeaderContent() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/apple-ids', label: 'Apple IDs' },
    { href: '/blog', label: 'Blog' },
  ];
  
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left: Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>HMA</span>
        </Link>

        {/* Middle: Navigation */}
        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile-Only Content (Inside Hamburger) */}
          <div className={styles.mobileExtra}>
            <div className={styles.mobileDivider} />
            
            <div className={styles.mobileRow}>
              <span className={styles.mobileLabel}>Appearance</span>
              <ThemeToggle />
            </div>

            {session?.user && (
              <>
                <div className={styles.mobileDivider} />
                <Link
                  href="/profile"
                  className={styles.mobileAccountLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles.mobileIcon}>👤</span> Profile Settings
                </Link>
                <button
                  className={styles.mobileSignOutBtn}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: '/login' });
                  }}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className={styles.actions}>
          {/* Desktop-Only Theme Toggle */}
          <div className={styles.desktopOnly}>
            <ThemeToggle />
          </div>

          {!session?.user && (
            <Link href="/login" className={styles.loginBtn}>
              Login
            </Link>
          )}

          {session?.user && (
            <>
              {/* Desktop User Dropdown */}
              <div className={`${styles.userDropdown} ${styles.desktopOnly}`} ref={dropdownRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  <div className={styles.avatar}>
                    {session.user.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        fill
                        sizes="40px"
                        unoptimized={session.user.image.toLowerCase().includes('.gif')}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      session.user.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <span className={styles.userName}>{session.user.name}</span>
                      <span className={styles.userEmail}>{session.user.email}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
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

              {/* Mobile-Only Top Profile Icon */}
              <Link href="/profile" className={styles.mobileOnlyAvatar} onClick={() => setMobileMenuOpen(false)}>
                <div className={styles.avatarSmall}>
                  {session.user.image ? (
                    <Image 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      fill
                      sizes="32px"
                      unoptimized={session.user.image.toLowerCase().includes('.gif')}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    session.user.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
              </Link>
            </>
          )}

          {/* Hamburger (Mobile) */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
          >
            <span className={mobileMenuOpen ? styles.hamTop : ''} />
            <span className={mobileMenuOpen ? styles.hamMid : ''} />
            <span className={mobileMenuOpen ? styles.hamBot : ''} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
