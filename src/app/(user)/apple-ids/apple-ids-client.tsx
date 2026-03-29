'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag } from '@/lib/utils';
import AppleIcon from '@/components/AppleIcon';
import { useToast } from '@/components/ui/Toast';
import styles from './apple-ids.module.css';

export default function AppleIdsClient() {
  const toast = useToast();
  const [appleIds, setAppleIds] = useState<AppleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [dbRevision, setDbRevision] = useState(0);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkResize = () => setIsMobile(window.innerWidth < 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  const PAGE_SIZE = 12;

  // Polling setup (replaces Realtime to avoid 200 connections limit)
  useEffect(() => {
    const interval = setInterval(() => {
      setDbRevision(prev => prev + 1); // Trigger refetch on interval
    }, 60000); // Poll every 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Main data fetching effect (reacts to filters, search, and db updates)
  useEffect(() => {
    const fetchAppleIds = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from('apple_ids')
          .select('*', { count: 'exact' });

        if (filter === 'active') {
          query = query.eq('is_active', true);
        } else if (filter === 'inactive') {
          query = query.eq('is_active', false);
        }

        query = query
          .order('is_active', { ascending: false })
          .order('created_at', { ascending: true });

        if (searchQuery.trim()) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        // Always fetch page 1 on filter/search changes
        const { data, count, error } = await query.range(0, PAGE_SIZE - 1);

        if (error) throw error;
        setAppleIds(data || []);
        
        // Check if there are more items to load
        setHasMore((data?.length || 0) === PAGE_SIZE && count !== null && count > PAGE_SIZE);
        setPage(2);
      } catch (err) {
        console.error('Error fetching apple ids:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchAppleIds();
    }, 400); // 400ms debounce for typing

    return () => clearTimeout(debounceTimer);
  }, [filter, searchQuery, dbRevision]);

  // Load More logic
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const supabase = createClient();
      let query = supabase
        .from('apple_ids')
        .select('*', { count: 'exact' });

      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      query = query
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: true });

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      
      setAppleIds(prev => [...prev, ...(data || [])]);
      setHasMore(count !== null && (to + 1) < count);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more apple ids:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = appleIds; // The list is already filtered by DB

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

        {/* Filters & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          
          <div className={styles.filters} style={{ margin: 0 }}>
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
              ⚪ Inactive
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search games or names..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', transition: 'border 0.3s' }}
              onFocus={(e) => e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.5)'}
              onBlur={(e) => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="skeleton" 
                style={{ height: '440px', borderRadius: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)' }} 
              />
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
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, margin: "-60px" }}
                variants={{ 
                  hidden: { opacity: 0, scale: 0.96, y: 40 }, 
                  visible: { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: {
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1], // Premium cubic-bezier for smooth reveal
                      delay: isMobile ? 0 : (index % 3) * 0.1 // Stagger by column on desktop
                    }
                  },
                  hover: { y: -10, transition: { duration: 0.4, ease: "easeOut" } }
                }}
                style={{ padding: 0, overflow: 'hidden', height: '440px', position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0f172a', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
              >
                  {/* Background Image */}
                  <motion.div style={{ position: 'absolute', inset: 0 }} variants={{ hidden: { scale: 1 }, visible: { scale: 1 }, hover: { scale: 1.08 } }} transition={{ duration: 0.6, ease: "easeOut" }}>
                    {appleId.images && appleId.images.length > 0 ? (
                      <Image 
                        src={appleId.images[0]} 
                        alt={appleId.title || 'Apple ID'} 
                        fill
                        priority={index < 3} // Next.js Performance Optimization (LCP Fix)
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
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
                        <h3 style={{ color: '#ffffff', margin: '0 0 16px 0', fontSize: '26px', fontWeight: 800, lineHeight: 1.2, textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '-0.5px' }}>
                          {appleId.title || 'Premium Apple ID'}
                        </h3>

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
                  {appleId.is_active ? (
                    <Link href={`/apple-ids/${appleId.id}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }} aria-label={`View Details for ${appleId.title}`} />
                  ) : (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.error('Locked', 'ID Lock ကျနေပါတယ်။');
                      }}
                      style={{ position: 'absolute', inset: 0, zIndex: 10 }} 
                      aria-label={`View Details for ${appleId.title} (Locked)`} 
                    />
                  )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px 32px', borderRadius: '100px', cursor: loadingMore ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s', opacity: loadingMore ? 0.7 : 1 }}
              onMouseOver={(e) => { if(!loadingMore) e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)' }}
              onMouseOut={(e) => { if(!loadingMore) e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)' }}
            >
              {loadingMore ? 'Loading...' : 'Load More Options ↓'}
            </button>
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

        {/* Warning (Pill Shaped & Centered) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '20px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '12px 28px', borderRadius: '50px', color: '#fbbf24', fontSize: '15px', width: 'max-content', maxWidth: '100%', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontWeight: 500, lineHeight: 1.5, letterSpacing: '0.2px' }}>ဤ Apple ID များကို ဆော့ဖ်ဝဲ download ရန်သာ အသုံးပြုပါ။</span>
          </div>
        </div>
      </div>
    </div>
  );
}
