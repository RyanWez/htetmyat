'use client';

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Client-side initialization during render to avoid cascading effects
  if (typeof window !== 'undefined' && !mounted) {
    const stored = localStorage.getItem('hma-theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored || preferred;
    
    // Update states synchronously during render if needed
    if (initial !== theme) setTheme(initial);
    setMounted(true);
  }

  // Update document attribute whenever theme changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hma-theme', next);
  };

  if (!mounted) {
    return (
      <button className={styles.toggle} aria-hidden="true">
        <span className={styles.icon}></span>
      </button>
    );
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className={styles.icon}>
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
