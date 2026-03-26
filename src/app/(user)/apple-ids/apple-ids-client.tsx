'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag } from '@/lib/utils';
import AppleIcon from '@/components/AppleIcon';
import styles from './apple-ids.module.css';

export default function AppleIdsClient() {
  const [appleIds, setAppleIds] = useState<AppleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={{ 
                  hidden: { opacity: 0, y: 12 }, 
                  visible: { opacity: 1, y: 0 },
                  hover: { opacity: 1, y: -6 }
                }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                style={{ padding: 0, overflow: 'hidden', height: '340px', position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0f172a', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              >
                  {/* Background Image */}
                  <motion.div style={{ position: 'absolute', inset: 0 }} variants={{ hidden: { scale: 1 }, visible: { scale: 1 }, hover: { scale: 1.08 } }} transition={{ duration: 0.6, ease: "easeOut" }}>
                    {appleId.images && appleId.images.length > 0 ? (
                      <img 
                        src={appleId.images[0]} 
                        alt={appleId.title || 'Apple ID'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                        <AppleIcon />
                      </div>
                    )}
                  </motion.div>

                  {/* Sleek Gradient Overlay */}
                  <motion.div 
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.6) 35%, rgba(0,0,0,0) 80%)' }}
                    variants={{ hidden: { opacity: 0.8 }, visible: { opacity: 0.8 }, hover: { opacity: 0.95 } }}
                  />

                  {/* Country Badge */}
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '6px', alignItems: 'center', zIndex: 2 }}>
                    {getCountryFlag(appleId.country)} <span style={{ color: '#f3f4f6', fontWeight: 600, letterSpacing: '0.5px' }}>{appleId.country}</span>
                  </div>

                  {/* Content (Bottom Anchored) */}
                  <motion.div 
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px', zIndex: 3 }}
                    variants={{ hidden: { y: 20 }, visible: { y: 20 }, hover: { y: 0 } }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  >
                        {/* Status Row with Pulse Animation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <motion.span 
                            animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: appleId.is_active ? '#10b981' : '#ef4444', boxShadow: appleId.is_active ? '0 0 12px #10b981' : '0 0 12px #ef4444' }}
                          />
                          <span style={{ color: appleId.is_active ? '#34d399' : '#f87171', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {appleId.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '26px', fontWeight: 800, lineHeight: 1.2, textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '-0.5px' }}>
                          {appleId.title || 'Premium Apple ID'}
                        </h3>
                        
                        {/* Subtitle / Email snippet */}
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {appleId.email}
                        </p>

                        <motion.div 
                          variants={{ hidden: { opacity: 0, height: 0, marginTop: 0 }, visible: { opacity: 0, height: 0, marginTop: 0 }, hover: { opacity: 1, height: 'auto', marginTop: 4 } }}
                          style={{ overflow: 'hidden' }}
                          transition={{ duration: 0.3 }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'background 0.2s', width: '100%', justifyContent: 'space-between' }}
                               onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                               onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                          >
                            <span>View Details</span> <span style={{ fontSize: '16px' }}>&rarr;</span>
                          </div>
                        </motion.div>
                  </motion.div>

                  {/* Clickable Card Link */}
                  <Link href={`/apple-ids/${appleId.id}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }} aria-label={`View Details for ${appleId.title}`} />
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
