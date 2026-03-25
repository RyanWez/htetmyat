'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import AppleIcon from '@/components/AppleIcon';
import styles from './apple-ids.module.css';

export default function AppleIdsClient() {
  const [appleIds, setAppleIds] = useState<AppleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchAppleIds();

    const supabase = createClient();
    const channel = supabase
      .channel('public:apple_ids')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apple_ids' },
        (payload) => {
          fetchAppleIds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppleIds = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('apple_ids')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppleIds(data || []);
    } catch (err) {
      console.error('Error fetching apple ids:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string, label?: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      toast.success(label ? `${label} copied to clipboard` : 'Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Failed to copy', 'Please copy manually.');
    }
  };

  const countries = [...new Set(appleIds.map((a) => a.country))];
  const filtered = filter === 'all'
    ? appleIds
    : appleIds.filter((a) => a.country === filter);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className={styles.pageTitle}><AppleIcon /> Free Apple IDs</h1>
          <p className={styles.pageDesc}>
            Browse available Apple IDs and copy credentials to use.
          </p>
        </motion.div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {countries.map((country) => (
            <button
              key={country}
              className={`${styles.filterBtn} ${filter === country ? styles.filterActive : ''}`}
              onClick={() => setFilter(country)}
            >
              {getCountryFlag(country)} {country}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map((appleId, index) => (
              <motion.div
                key={appleId.id}
                className={`glass-card ${styles.card}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.appleIcon}><AppleIcon /></span>
                  <span className={styles.cardEmail}>{appleId.email}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Password</span>
                    <div className={styles.fieldValue}>
                      <span className={styles.password}>••••••••</span>
                      <button
                        className={`btn btn-sm btn-ghost ${styles.copyBtn}`}
                        onClick={() => handleCopy(appleId.password, `pwd-${appleId.id}`, 'Password')}
                      >
                        {copiedId === `pwd-${appleId.id}` ? '✅ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Country</span>
                    <span className={styles.fieldValue}>
                      {getCountryFlag(appleId.country)} {appleId.country}
                    </span>
                  </div>

                  <div className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>Status</span>
                    <span className={`badge ${appleId.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {appleId.is_active ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </div>
                </div>

                {appleId.notes && (
                  <div className={styles.cardNotes}>
                    <span className={styles.notesIcon}>📝</span>
                    {appleId.notes}
                  </div>
                )}

                <div className={styles.cardActions}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCopy(appleId.email, `email-${appleId.id}`, 'Email')}
                  >
                    {copiedId === `email-${appleId.id}` ? '✅ Copied!' : '📋 Copy Email'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(appleId.password, `pwd2-${appleId.id}`, 'Password')}
                  >
                    {copiedId === `pwd2-${appleId.id}` ? '✅ Copied!' : '🔑 Copy Password'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><AppleIcon /></span>
            <h3>No Apple IDs Available</h3>
            <p>Check back later for new Apple IDs.</p>
          </div>
        )}

        {/* Warning */}
        <div className={styles.warning}>
          <span>⚠️</span>
          <p>ဤ Apple ID များကို ဆော့ဖ်ဝဲ download ရန်သာ အသုံးပြုပါ။ Password မပြောင်းပါနှင့်။</p>
        </div>
      </div>
    </div>
  );
}
