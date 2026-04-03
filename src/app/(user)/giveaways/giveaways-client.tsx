'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Giveaway } from '@/lib/supabase/types';
import styles from './giveaways.module.css';

interface GiveawaysClientProps {
  currentUser?: { id: string; name?: string | null; email?: string | null; } | null;
}

export default function GiveawaysClient({ currentUser }: GiveawaysClientProps) {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 12;

  useEffect(() => {
    const fetchGiveaways = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from('giveaways')
          .select('*', { count: 'exact' });

        if (filter === 'active') {
          query = query.eq('is_active', true);
        } else if (filter === 'inactive') {
          query = query.eq('is_active', false);
        }

        query = query
          .order('is_active', { ascending: false })
          .order('created_at', { ascending: false });

        const safeQuery = searchQuery.trim().replace(/[%_\\]/g, '\\$&');
        if (safeQuery) {
          query = query.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);
        }

        const { data, count, error } = await query.range(0, PAGE_SIZE - 1);

        if (error) throw error;
        setGiveaways(data || []);
        
        setHasMore((data?.length || 0) === PAGE_SIZE && count !== null && count > PAGE_SIZE);
        setPage(2);
      } catch (err) {
        console.error('Error fetching giveaways:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchGiveaways();
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [filter, searchQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const supabase = createClient();
      let query = supabase
        .from('giveaways')
        .select('*', { count: 'exact' });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      query = query
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      const safeQuery = searchQuery.trim().replace(/[%_\\]/g, '\\$&');
      if (safeQuery) {
        query = query.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);
      }

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      
      setGiveaways(prev => [...prev, ...(data || [])]);
      setHasMore(count !== null && (to + 1) < count);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more giveaways:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('vpn') || type.toLowerCase().includes('v2ray') || type.toLowerCase().includes('outline')) return '🛡️';
    if (type.toLowerCase().includes('account')) return '👤';
    if (type.toLowerCase().includes('key')) return '🔑';
    return '🎁';
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className={styles.pageTitle}>
            <svg 
              width="40" height="40" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              style={{ color: '#a855f7', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.4))' }}
            >
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
            <span className={styles.pageTitleText}>Premium Giveaways</span>
          </h1>
          <p className={styles.pageDesc}>
            Exclusive VPN keys, premium accounts, and more.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'active' ? styles.filterActive : ''}`}
              onClick={() => setFilter('active')}
            >
              🟢 Active
            </button>
            <button
              className={`${styles.filterBtn} ${filter === 'inactive' ? styles.filterActive : ''}`}
              onClick={() => setFilter('inactive')}
            >
              ⚪ Expired
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search giveaways..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(168, 85, 247, 0.5)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        {loading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="skeleton" 
                style={{ height: '320px', borderRadius: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }} 
              />
            ))}
          </div>
        )}

        {!loading && giveaways.length > 0 && (
          <div className={styles.grid}>
            {giveaways.map((giveaway, index) => (
              <motion.div
                key={giveaway.id}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, margin: "-60px" }}
                variants={{ 
                  hidden: { opacity: 0, scale: 0.96, y: 40 }, 
                  visible: { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { duration: 0.5, delay: (index % 3) * 0.1 }
                  },
                  hover: { y: -8, transition: { duration: 0.3 } }
                }}
                style={{ padding: 0, overflow: 'hidden', height: '320px', position: 'relative', borderRadius: '24px', border: '1px solid rgba(168, 85, 247, 0.15)', backgroundColor: '#0b0f19', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
              >
                  <motion.div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} variants={{ hover: { scale: 1.05 } }} transition={{ duration: 0.6 }}>
                    {giveaway.image_url ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, #020617 100%)' }}>
                        <Image 
                          src={giveaway.image_url} 
                          alt={giveaway.title} 
                          width={140}
                          height={140}
                          style={{ objectFit: 'contain', opacity: giveaway.is_active ? 0.9 : 0.4, filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)' }}>
                        <span style={{ fontSize: '80px', opacity: 0.1 }}>{getTypeIcon(giveaway.type)}</span>
                      </div>
                    )}
                  </motion.div>

                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '6px', alignItems: 'center', zIndex: 2, color: '#e2e8f0', fontWeight: 600 }}>
                    {giveaway.type === 'ACCOUNT' ? 'Account' : giveaway.type === 'VPN_KEY' ? 'VPN Key' : giveaway.type}
                  </div>

                  <motion.div 
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px', zIndex: 3, background: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.4) 60%, transparent 100%)' }}
                  >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <motion.span 
                            animate={giveaway.is_active ? { opacity: [1, 0.4, 1] } : {}} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: giveaway.is_active ? '#10b981' : '#64748b', boxShadow: giveaway.is_active ? '0 0 12px #10b981' : 'none' }}
                          />
                          <span style={{ color: giveaway.is_active ? '#34d399' : '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {giveaway.is_active ? 'Active' : 'Expired'}
                          </span>
                        </div>

                        <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                          {giveaway.title}
                        </h3>
                        
                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {giveaway.description || 'Premium giveaway details inside.'}
                        </p>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: giveaway.is_active ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', color: giveaway.is_active ? '#d8b4fe' : '#94a3b8', border: `1px solid ${giveaway.is_active ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.1)'}`, padding: '10px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all 0.2s' }}>
                          <span>{giveaway.is_active ? (currentUser ? 'View Credentials' : 'Login to Unlock') : 'View Details'}</span> <span style={{ fontSize: '16px' }}>&rarr;</span>
                        </div>
                  </motion.div>

                  <Link href={`/giveaways/${giveaway.id}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }} aria-label={`View ${giveaway.title}`} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && hasMore && giveaways.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '12px 32px', borderRadius: '100px', cursor: loadingMore ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '15px', transition: 'background 0.2s' }}
            >
              {loadingMore ? 'Loading...' : 'Load More ↓'}
            </button>
          </div>
        )}

        {!loading && giveaways.length === 0 && (
          <div className={styles.empty}>
            <span>🎁</span>
            <h3>No Giveaways Right Now</h3>
            <p>Check back later for premium drops!</p>
          </div>
        )}
      </div>
    </div>
  );
}
