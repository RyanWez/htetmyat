'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import AppleIcon from '@/components/AppleIcon';

export default function AppleIdDetailClient({ id }: { id: string }) {
  const [appleId, setAppleId] = useState<AppleId | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxImage]);

  const fetchAppleId = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('apple_ids')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
        
      if (error) throw error;
      setAppleId(data);
    } catch (err) {
      console.error('Error fetching apple id details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    fetchAppleId();
  }, [id, fetchAppleId]);

  const handleCopy = async (text: string, copyId: string, label?: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(copyId);
      if (!isMobile) {
        toast.success(label ? `${label} copied to clipboard!` : 'Copied to clipboard!');
      } else {
        toast.success('Copied!');
      }
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Failed to copy', 'Please copy manually.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (!appleId) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <AppleIcon />
        <h2 style={{ marginTop: 'var(--space-4)' }}>Apple ID Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>This ID may have been removed or is inactive.</p>
        <Link href="/apple-ids" className="btn btn-primary" style={{ marginTop: 'var(--space-6)' }}>
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 'var(--space-8) 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <Link href="/apple-ids" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 'var(--space-6)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
            <span>←</span> Back to Library
          </Link>

          {/* Previews Section */}
          {appleId.images && appleId.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: 'var(--space-8)' }}
            >
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: 'var(--text-xl)' }}>Previews & Available Games</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Click an image to view it in full screen.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                {appleId.images.map((img, i) => (
                  <motion.div 
                    key={i} 
                    style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#050505', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', aspectRatio: 'auto' }}
                    whileHover={{ scale: 1.01, boxShadow: '0 15px 40px rgba(0,0,0,0.6)' }}
                    onClick={() => setLightboxImage(img)}
                  >
                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '30px', color: 'white', fontSize: '13px', fontWeight: 500, backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', gap: '6px', alignItems: 'center', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      Click to Zoom
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: 'auto', minHeight: '400px' }}>
                      <Image 
                        src={img} 
                        alt={`${appleId.title} preview ${i + 1}`} 
                        fill 
                        sizes="(max-width: 800px) 100vw, 800px"
                        style={{ objectFit: 'contain', opacity: 0.9, transition: 'opacity 0.3s' }} 
                        loading="lazy" 
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Info Card */}
          <motion.div 
            className="glass-card" 
            style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Header info */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h1 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {appleId.title || 'Premium Apple ID'}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--bg-card-hover)', borderRadius: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 500 }}>
                  <span style={{ fontSize: '18px' }}>{getCountryFlag(appleId.country)}</span> Region: {appleId.country}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '24px', fontSize: 'var(--text-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 500 }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Active
                </span>
              </div>
              
              {appleId.description && (
                <div style={{ padding: 'var(--space-5)', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description & Games</h4>
                  <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {appleId.description}
                  </p>
                </div>
              )}

              {appleId.notes && (
                <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(255, 171, 0, 0.08)', color: '#ffab00', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid #ffab00', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>📝</span> 
                  <span style={{ lineHeight: 1.5, fontWeight: 500 }}>{appleId.notes}</span>
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-6) 0' }} />

            {/* Credentials Section - Responsive Floating Island */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginTop: 'var(--space-10)', position: 'relative', width: '100%' }}
            >
              
              {/* Floating Container */}
              <div style={{ 
                width: '100%',
                maxWidth: '640px', 
                margin: '0 auto', 
                padding: 'clamp(24px, 8vw, 48px) clamp(16px, 5vw, 40px)', 
                background: 'var(--bg-elevated)', 
                backdropFilter: 'blur(20px)',
                borderRadius: 'clamp(24px, 6vw, 48px)', 
                border: '1px solid var(--border-default)', 
                boxShadow: 'var(--shadow-lg)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'clamp(20px, 5vw, 32px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                
                {/* Glow decorations */}
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--accent-warning-light) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 'clamp(20px, 4vw, 24px)' }}>🔐</span>
                  <h3 style={{ margin: 0, fontSize: 'clamp(18px, 4.5vw, 22px)', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.5px', textShadow: '0 1px 2px var(--shadow-sm)', textAlign: 'center' }}>Secure Credentials</h3>
                </div>

                {/* Email Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1, minWidth: 0 }}>
                  <label style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, paddingLeft: '20px', opacity: 0.7 }}>Apple ID Email</label>
                  <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'nowrap', alignItems: 'center', minWidth: 0 }}>
                    {/* Value Pill */}
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 28px)', 
                      background: 'var(--bg-inset)', 
                      border: '1.5px solid var(--border-default)', 
                      borderRadius: '100px', 
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      overflow: 'hidden'
                    }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 'clamp(13px, 3.5vw, 15px)', 
                        color: 'var(--brand-primary)', 
                        fontWeight: 700, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        width: '100%',
                        display: 'block'
                      }}>
                        {appleId.email}
                      </span>
                    </div>
                    {/* Copy Button */}
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy(appleId.email, 'email', 'Email')}
                      style={{ 
                        padding: isMobile ? '0' : 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)', 
                        background: copiedId === 'email' ? 'var(--accent-success-light)' : 'var(--brand-light)', 
                        color: copiedId === 'email' ? 'var(--accent-success)' : 'var(--brand-primary)', 
                        border: copiedId === 'email' ? '1.5px solid var(--accent-success)' : '1px solid var(--border-default)', 
                        borderRadius: isMobile ? '50%' : '100px', 
                        fontWeight: 800, 
                        fontSize: '13px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: isMobile ? '0' : '8px', 
                        boxShadow: 'var(--shadow-sm)',
                        flexShrink: 0,
                        width: isMobile ? '56px' : 'auto',
                        height: isMobile ? '56px' : 'auto'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{copiedId === 'email' ? '✅' : '📋'}</span>
                      {!isMobile && (copiedId === 'email' ? 'Copied' : 'Copy Email')}
                    </motion.button>
                  </div>
                </div>

                {/* Password Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1, minWidth: 0 }}>
                  <label style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, paddingLeft: '20px', opacity: 0.7 }}>Password</label>
                  <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'nowrap', alignItems: 'center', minWidth: 0 }}>
                    {/* Value Pill */}
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 28px)', 
                      background: 'var(--bg-inset)', 
                      border: '1.5px solid var(--border-default)', 
                      borderRadius: '100px', 
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      overflow: 'hidden'
                    }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 'clamp(14px, 3.8vw, 16px)', 
                        color: 'var(--accent-warning)', 
                        fontWeight: 700, 
                        letterSpacing: '1.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        display: 'block'
                      }}>
                        {appleId.password}
                      </span>
                    </div>
                    {/* Copy Button */}
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy(appleId.password, 'password', 'Password')}
                      style={{ 
                        padding: isMobile ? '0' : 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)', 
                        background: copiedId === 'password' ? 'var(--accent-success-light)' : 'var(--accent-warning-light)', 
                        color: copiedId === 'password' ? 'var(--accent-success)' : 'var(--accent-warning)', 
                        border: copiedId === 'password' ? '1.5px solid var(--accent-success)' : '1px solid var(--border-default)', 
                        borderRadius: isMobile ? '50%' : '100px', 
                        fontWeight: 800, 
                        fontSize: '13px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: isMobile ? '0' : '8px', 
                        boxShadow: 'var(--shadow-sm)',
                        flexShrink: 0,
                        width: isMobile ? '56px' : 'auto',
                        height: isMobile ? '56px' : 'auto'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{copiedId === 'password' ? '✅' : '🔑'}</span>
                      {!isMobile && (copiedId === 'password' ? 'Copied' : 'Copy Password')}
                    </motion.button>
                  </div>
                </div>

              </div>
            </motion.div>

             {/* Usage Warning */}
             <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(255, 60, 60, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(255, 60, 60, 0.3)', display: 'flex', gap: '12px' }}>
               <span style={{ fontSize: '20px' }}>⚠️</span>
               <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 <strong>အရေးကြီး အသိပေးချက်:</strong> ဤ Apple ID များကို App Store မှ ဆော့ဖ်ဝဲ (Apps/Games) ဒေါင်းရန်အတွက်သာ အသုံးပြုပါ။ Settings ထဲမှ iCloud နေရာတွင် လုံးဝ (လုံးဝ) ဝင်ရောက်ခြင်း မလုပ်ပါနှင့်။
               </div>
             </div>
          </motion.div>

        </div>
      </div>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}
            onClick={() => setLightboxImage(null)}
          >
            {/* Close Button */}
            <button 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, transition: 'background 0.2s' }}
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>

            {/* Lightbox Image */}
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh', width: '100%', height: '90vh' }}>
              <Image 
                src={lightboxImage} 
                alt="Fullscreen expanded preview" 
                fill
                sizes="100vw"
                style={{ objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-out' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImage(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
