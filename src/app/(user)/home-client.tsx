'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import AppleIcon from '@/components/AppleIcon';
import styles from './home.module.css';

export default function HomeClient() {
  const { data: session } = useSession();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className={styles.page} ref={ref}>
      {/* Dynamic Animated Background */}
      <motion.div className={styles.pageBg} style={{ y: yBg, opacity: opacityBg }}>
        <div className={styles.glow1} />
        <div className={styles.glow2} />
      </motion.div>

      {/* Hero Section */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.heroContent}>
          <motion.div 
            className={styles.heroPill}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className={styles.heroPillSpot}></span>
            System Operational • 24/7 Access
          </motion.div>
          
          <h1 className={styles.heroTitle}>
            Premium Access to <br/>
            <span className="text-gradient">HMA Apple IDs</span>
          </h1>
          <p className={styles.heroDesc}>
            Gain instant access to our managed, updated, and highly secure Apple IDs. Download your favorite iOS apps securely, without boundaries.
          </p>
          <div className={styles.heroCta}>
            <Link href="/apple-ids" className="btn btn-gradient btn-lg">
              Browse Apple IDs →
            </Link>
            <Link href="/blog" className="btn btn-secondary btn-lg">
              Read Our Blog
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Stats Bar */}
      <motion.section
        className={styles.statsBar}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.statsInner}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}><AppleIcon /></div>
            <div>
              <div className={styles.statValue}>12+</div>
              <div className={styles.statLabel}>Active IDs</div>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🔄</div>
            <div>
              <div className={styles.statValue}>Daily</div>
              <div className={styles.statLabel}>Updates</div>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🌐</div>
            <div>
              <div className={styles.statValue}>24/7</div>
              <div className={styles.statLabel}>Available</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Quick Access Section */}
      <motion.section
        className={styles.section}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.container}>
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-8)" }}>
             <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Explore HMA</h2>
          </div>
          <div className={styles.quickCards}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Link href="/apple-ids" className={`glass-card ${styles.quickCard}`}>
                <div className={styles.quickIcon}>🔑</div>
                <h3>Apple IDs Library</h3>
                <p>Browse our extensive library of shared Apple IDs to download any premium or region-locked iOS app instantly.</p>
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Link href="/blog" className={`glass-card ${styles.quickCard}`}>
                <div className={styles.quickIcon}>📰</div>
                <h3>Guides & Articles</h3>
                <p>Read detailed tutorials, troubleshooting tips, and stay updated with the latest iOS tricks.</p>
              </Link>
            </motion.div>
            
            {session?.user?.role === 'admin' && (
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                <Link href="/admin" className={`glass-card ${styles.quickCard}`}>
                  <div className={styles.quickIcon}>⚙️</div>
                  <h3>Admin Dashboard</h3>
                  <p>Manage the entire system infrastructure including users, posts, IDs, and site settings securely.</p>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Warning */}
      <motion.section
        className={styles.section}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.container}>
          <div className={styles.warning}>
            <div className={styles.warningIcon}>⚠️</div>
            <p>
              ဤ Apple ID များကို ဆော့ဖ်ဝဲ download ရန်သာ အသုံးပြုပါ။ Settings အထဲမှ iCloud နေရာတွင် ဝင်မထားပါနှင့်။ App Store ကနေသာ ဝင်ပါ။ Password လုံးဝ (လုံးဝ) မပြောင်းပါနှင့်။ ပြောင်းလဲပါက Account Lock ကျသွားပါမည်။
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
