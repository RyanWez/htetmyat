'use client';

import { useState, useEffect } from 'react';
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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    fetchAppleId();
  }, [id]);

  const fetchAppleId = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('apple_ids')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
        
      if (error) throw error;
      setAppleId(data);
    } catch (err) {
      console.error('Error fetching apple id details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, copyId: string, label?: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(copyId);
      toast.success(label ? `${label} copied to clipboard!` : 'Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Failed to copy', 'Please copy manually.');
    }
  };

  // Images are now stacked, no need for prevImage/nextImage sliders

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

          {/* Info Card (Top) */}
          <motion.div 
            className="glass-card" 
            style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header info */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{getCountryFlag(appleId.country)}</span>
                <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700, background: 'linear-gradient(45deg, var(--text-primary), var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {appleId.title || 'Premium Apple ID'}
                </h1>
              </div>
              
              {appleId.description && (
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {appleId.description}
                </p>
              )}
              {appleId.notes && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', padding: '12px', background: 'rgba(255, 171, 0, 0.1)', color: 'var(--color-warning)', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)' }}>
                  <span>📝</span> <span>{appleId.notes}</span>
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-6) 0' }} />

            {/* Credentials Section */}
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>Credentials</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              
              {/* Email Box */}
              <div style={{ padding: 'var(--space-4)', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Apple ID Email</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 500 }}>{appleId.email}</div>
                </div>
                <button 
                  onClick={() => handleCopy(appleId.email, 'email', 'Email')}
                  className="btn btn-gradient"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                   {copiedId === 'email' ? '✅ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Password Box */}
              <div style={{ padding: 'var(--space-4)', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Password</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 500 }}>{appleId.password}</div>
                </div>
                <button 
                  onClick={() => handleCopy(appleId.password, 'password', 'Password')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                   {copiedId === 'password' ? '✅ Copied' : '🔑 Copy'}
                </button>
              </div>

            </div>

             {/* Usage Warning */}
             <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(255, 60, 60, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(255, 60, 60, 0.3)', display: 'flex', gap: '12px' }}>
               <span style={{ fontSize: '20px' }}>⚠️</span>
               <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 <strong>အရေးကြီး အသိပေးချက်:</strong> ဤ Apple ID များကို App Store မှ ဆော့ဖ်ဝဲ (Apps/Games) ဒေါင်းရန်အတွက်သာ အသုံးပြုပါ။ Settings ထဲမှ iCloud နေရာတွင် လုံးဝ (လုံးဝ) ဝင်ရောက်ခြင်း မလုပ်ပါနှင့်။ Password အား ပြောင်းလဲရန် ကြိုးစားခြင်း မပြုလုပ်ပါနှင့်။
               </div>
             </div>
          </motion.div>

          {/* Images Section (Bottom) */}
          {appleId.images && appleId.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: 'var(--text-xl)' }}>Previews & Available Games</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Click an image to view it in full screen.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {appleId.images.map((img, i) => (
                  <motion.div 
                    key={i} 
                    style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                    whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                    onClick={() => setLightboxImage(img)}
                  >
                    <img src={img} alt={`${appleId.title} preview ${i + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

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
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>

            {/* Lightbox Image */}
            <motion.img 
              src={lightboxImage} 
              alt="Fullscreen expanded preview" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-out' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
