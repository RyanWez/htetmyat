'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag, copyToClipboard } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import AppleIcon from '@/components/AppleIcon';
import { addComment, getAppleIdData } from './actions';
import { useSession } from 'next-auth/react';

interface Profile {
  display_name: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: Profile;
}

export default function AppleIdDetailClient({ id }: { id: string }) {
  const { data: session } = useSession();
  const currentUser = session?.user;
  
  const [appleId, setAppleId] = useState<AppleId | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      const currentVal = textareaRef.current.value;
      const mention = `@${replyingTo.name} `;
      if (!currentVal.startsWith(mention)) {
        textareaRef.current.value = mention;
      }
      textareaRef.current.focus();
    }
  }, [replyingTo]);

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
      const { appleId: appleData, comments: commentsData } = await getAppleIdData(id);
      setAppleId(appleData);
      setComments((commentsData as Comment[]) || []);
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

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsSubmitting(true);
    const formData = new FormData(form);
    try {
      await addComment(formData);
      toast.success('Comment posted!', 'မှတ်ချက်ထည့်သွင်းမှု အောင်မြင်ပါသည်။');
      form.reset();
      setReplyingTo(null);
      await fetchAppleId();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'မှတ်ချက်ထည့်သွင်းခြင်း မအောင်မြင်ပါ။';
      toast.error('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to flatly fetch all descendants of a comment
  const getThreadComments = (parentId: string): Comment[] => {
    const thread: Comment[] = [];
    const collect = (id: string) => {
      const children = comments.filter(c => c.parent_id === id);
      children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (const child of children) {
        thread.push(child);
        collect(child.id);
      }
    };
    collect(parentId);
    // Finally, sort entire thread by date to ensure proper timeline
    return thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const renderSingleComment = (comment: Comment, isReply: boolean = false) => {
    return (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ width: isReply ? '32px' : '40px', height: isReply ? '32px' : '40px', borderRadius: '50%', backgroundColor: 'var(--bg-inset)', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid var(--border-color)', marginTop: '2px' }}>
          {comment.profiles?.avatar_url ? (
             <Image src={comment.profiles.avatar_url} alt={comment.profiles.display_name || 'User'} fill sizes={isReply ? "32px" : "40px"} style={{ objectFit: 'cover' }} />
          ) : (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isReply ? '14px' : '18px' }}>👤</div>
          )}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: isReply ? 'var(--bg-card)' : 'var(--bg-card-hover)', padding: '10px 14px', borderRadius: '16px', display: 'inline-block', maxWidth: '100%', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: isReply ? '13px' : '14px' }}>{comment.profiles?.display_name || 'Anonymous User'}</span>
            </div>
            <p style={{ margin: 0, fontSize: isReply ? '13.5px' : '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {comment.comment_text}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', marginLeft: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(comment.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            {currentUser && (
              <button 
                onClick={() => setReplyingTo({ id: comment.id, name: comment.profiles?.display_name || 'Anonymous User' })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--brand-primary)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

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

          {/* Comments Section */}
          <motion.div
            className="glass-card"
            style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              💬 Comments 
            </h3>

            {/* Comment Form */}
            {currentUser ? (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                {replyingTo && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-inset)', padding: '8px 16px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Replying to <strong>{replyingTo.name}</strong>
                    </span>
                    <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>✕</button>
                  </div>
                )}
                <form 
                  onSubmit={handleCommentSubmit} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'flex-start',
                    background: 'var(--bg-card)',
                    padding: '16px',
                    borderRadius: replyingTo ? '0 0 12px 12px' : '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <input type="hidden" name="apple_id" value={id} />
                  {replyingTo && <input type="hidden" name="parent_id" value={replyingTo.id} />}
                  
                  {/* Current user avatar placeholder */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-glow)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', overflow: 'hidden', position: 'relative' }}>
                    {currentUser.image ? (
                       <Image src={currentUser.image} alt={currentUser.name || 'User'} fill sizes="40px" style={{ objectFit: 'cover' }} />
                    ) : (
                       currentUser.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                    <textarea 
                      ref={textareaRef}
                      name="comment_text" 
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      rows={2}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: 'var(--bg-inset)', 
                        border: 'none', 
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        minHeight: '44px'
                      }}
                    ></textarea>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        style={{ 
                          background: 'var(--brand-primary)', 
                          color: '#fff', 
                          padding: '8px 20px', 
                          borderRadius: '20px', 
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          opacity: isSubmitting ? 0.7 : 1,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', background: 'var(--bg-inset)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-8)', border: '1px solid var(--border-default)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>မှတ်ချက်ပေးရန် သို့မဟုတ် စာပြန်ရန် လော့ဂ်အင် ဝင်ပါ။</p>
                <Link href="/login" style={{ background: 'var(--brand-primary)', color: '#fff', padding: '8px 24px', borderRadius: '40px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                  Log In
                </Link>
              </div>
            )}

            {/* Existing Comments */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '32px',
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '8px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border-color) transparent'
            }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>မှတ်ချက် မရှိသေးပါ။ ပထမဆုံး မှတ်ချက်ပေးပါ။</p>
              ) : (
                comments.filter(c => c.parent_id === null).map((parentComment) => {
                  const threadComments = getThreadComments(parentComment.id);
                  return (
                    <div key={parentComment.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Parent Comment */}
                      {renderSingleComment(parentComment, false)}
                      
                      {/* Replies */}
                      {threadComments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '52px', position: 'relative' }}>
                           {/* Decorative Vertical Line connecting replies */}
                           <div style={{ position: 'absolute', left: '25px', top: '0', bottom: '16px', width: '2px', background: 'var(--border-color)', borderRadius: '2px', opacity: 0.7 }} />
                           
                           {threadComments.map((reply, index) => (
                             <div key={reply.id} style={{ position: 'relative' }}>
                               {/* Decorative Curve Line for each reply */}
                               <div style={{ position: 'absolute', left: '-27px', top: '16px', width: '16px', height: '2px', background: 'var(--border-color)', borderRadius: '2px', opacity: 0.7 }} />
                               {renderSingleComment(reply, true)}
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
