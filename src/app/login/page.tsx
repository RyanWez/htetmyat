'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ui/ThemeToggle';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.themeCorner}>
        <ThemeToggle />
      </div>

      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◉</span>
          <span className={styles.logoText}>HMA</span>
        </div>

        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to access premium Apple IDs</p>

        {error && (
          <motion.div 
            className={styles.error}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className="input-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="admin@hma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className="input-label">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className={`btn btn-gradient btn-lg ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>

      <motion.p 
        className={styles.footerText}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        © {new Date().getFullYear()} HMA — Secure Access Only
      </motion.p>
    </div>
  );
}
