'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';
import { checkAccountStatus, checkDeviceLimitByEmail, registerDeviceByEmail } from './actions';
import { generateDeviceFingerprint, getDeviceName } from '@/lib/device-fingerprint';
import styles from './login.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const suspendedToastShown = useRef(false);
  const deviceFingerprintRef = useRef<string>('');
  const deviceNameRef = useRef<string>('Unknown Device');

  // Generate device fingerprint on mount
  useEffect(() => {
    generateDeviceFingerprint().then(fp => {
      deviceFingerprintRef.current = fp;
    });
    deviceNameRef.current = getDeviceName();
  }, []);

  // Show suspended toast when redirected from middleware
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'suspended' && !suspendedToastShown.current) {
      suspendedToastShown.current = true;
      const timer = setTimeout(() => {
        toast.error(
          '🚫 အကောင့် ရပ်ထားပါသည်',
          'သင့်အကောင့်ကို Admin မှ ရပ်ဆိုင်းထားပါသည်။ အကူအညီလိုပါက Admin ထံ ဆက်သွယ်ပါ။'
        );
        router.replace('/login', { scroll: false });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, toast, router]);

  // Show device limit toast when redirected
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'device_limit') {
      const timer = setTimeout(() => {
        toast.error(
          '📱 Device ကန့်သတ်ချက်',
          'သင့် Device ကန့်သတ်ချက် ပြည့်သွားပါပြီ။ Admin ထံ ဆက်သွယ်ပါ။'
        );
        router.replace('/login', { scroll: false });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Check account status before attempting login
      const statusCheck = await checkAccountStatus(email);
      if (statusCheck.isSuspended) {
        toast.error(
          '🚫 အကောင့် ရပ်ထားပါသည်',
          'သင့်အကောင့်ကို Admin မှ ရပ်ဆိုင်းထားပါသည်။ အကူအညီလိုပါက Admin ထံ ဆက်သွယ်ပါ။'
        );
        setLoading(false);
        return;
      }

      // Step 2: Check device limit BEFORE login
      const fingerprint = deviceFingerprintRef.current;
      if (fingerprint) {
        const deviceCheck = await checkDeviceLimitByEmail(email, fingerprint);
        if (!deviceCheck.allowed) {
          toast.error(
            '📱 Device ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
            'သင့်အကောင့်အတွက် Device အရေအတွက် ပြည့်သွားပါပြီ။ Admin ထံ ဆက်သွယ်ပါ။'
          );
          setLoading(false);
          return;
        }
      }

      // Step 3: Proceed with login
      const result = await signIn('credentials', {
        email,
        password,
        fingerprint,
        deviceName: deviceNameRef.current,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('ACCOUNT_SUSPENDED') || result.code === 'ACCOUNT_SUSPENDED') {
          toast.error(
            '🚫 အကောင့် ရပ်ထားပါသည်',
            'သင့်အကောင့်ကို Admin မှ ရပ်ဆိုင်းထားပါသည်။ အကူအညီလိုပါက Admin ထံ ဆက်သွယ်ပါ။'
          );
        } else {
          toast.error('Login Failed', 'အကောင့်မရှိတာ (သို့) Password မှားနေပါတယ်');
        }
      } else {
        // Device is now securely registered natively inside auth.ts!
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Login submit error:', err);
      // Ignore NEXT_REDIRECT errors so Next.js can navigate
      if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string' && (err as any).message.includes('NEXT_REDIRECT')) {
        throw err;
      }
      toast.error('Error', 'စနစ်ချို့ယွင်းမှုဖြစ်ပေါ်နေပါတယ်။ ခဏနေမှပြန်ကြိုးစားကြည့်ပါ။');
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
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18 }} /> Authenticating...</>
            ) : 'Sign In'}
          </motion.button>
        </form>

        <div className={styles.contactAdminWrapper}>
          <p className={styles.contactText}>Don&apos;t have an account or lost access?</p>
          <motion.a
            href="https://t.me/H_M_A_2026"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.adminPill}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className={styles.adminIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#2AABEE">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </span>
            <span className={styles.adminText}>Contact to Admin</span>
          </motion.a>
        </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

