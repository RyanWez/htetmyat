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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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

  const nextImage = () => {
    if (appleId?.images && appleId.images.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % appleId.images.length);
    }
  };

  const prevImage = () => {
    if (appleId?.images && appleId.images.length > 0) {
      setActiveImageIndex((prev) => (prev - 1 + appleId.images.length) % appleId.images.length);
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
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <Link href="/apple-ids" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 'var(--space-6)', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
          <span>←</span> Back to Library
        </Link>

        <motion.div 
          className="glass-card" 
          style={{ padding: 0, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Gallery Section */}
          <div style={{ backgroundColor: 'var(--bg-card)', position: 'relative', height: '350px', display: 'flex', flexDirection: 'column' }}>
            {appleId.images && appleId.images.length > 0 ? (
              <>
                <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImageIndex}
                      src={appleId.images[activeImageIndex]}
                      alt={`${appleId.title} preview ${activeImageIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </AnimatePresence>
                  
                  {appleId.images.length > 1 && (
                    <>
                      <button onClick={prevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        ❮
                      </button>
                      <button onClick={nextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                        ❯
                      </button>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {appleId.images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--bg-card)', overflowX: 'auto' }}>
                    {appleId.images.map((img, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        style={{ 
                          border: activeImageIndex === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          width: '60px',
                          height: '60px',
                          padding: 0,
                          cursor: 'pointer',
                          opacity: activeImageIndex === i ? 1 : 0.6,
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={img} alt={`thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                <AppleIcon />
              </div>
            )}
          </div>

          <div style={{ padding: 'var(--space-8)' }}>
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

          </div>
        </motion.div>
      </div>
    </div>
  );
}
