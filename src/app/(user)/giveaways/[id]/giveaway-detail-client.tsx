'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Giveaway, GiveawaySecret } from '@/lib/supabase/types';
import { useToast } from '@/components/ui/Toast';
import { addComment, deleteComment } from './actions';
import styles from './giveaway-detail.module.css';

interface CommentType {
  id: string;
  giveaway_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  parent_id: string | null;
  profile?: { id: string; display_name: string; avatar_url: string; role: string; };
  profiles?: Record<string, unknown> | Record<string, unknown>[];
}

interface GiveawayDetailProps {
  giveaway: Giveaway;
  secret: GiveawaySecret | null;
  initialComments: CommentType[];
  currentUser: { id: string; name?: string | null; email?: string | null; role?: string; image?: string | null; } | null;
}

export default function GiveawayDetailClient({ giveaway, secret, initialComments, currentUser }: GiveawayDetailProps) {
  const toast = useToast();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Copied', 'Credential copied to clipboard.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('giveaway_id', giveaway.id);
    formData.append('comment_text', commentText);

    try {
      await addComment(formData);
      toast.success('Success', 'Comment added.');
      setCommentText('');
      
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(id, giveaway.id);
      setComments(comments.filter(c => c.id !== id));
      toast.success('Deleted', 'Comment has been removed.');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Error', error.message || 'Failed to delete comment.');
    }
  };

  const metadataEntries = giveaway.metadata ? Object.entries(giveaway.metadata) : [];
  
  let accountEmail = '';
  let accountPassword = '';
  
  if (giveaway.type === 'ACCOUNT' && secret?.credentials) {
    try {
      const parsed = JSON.parse(secret.credentials);
      accountEmail = parsed.email || '';
      accountPassword = parsed.password || '';
    } catch {
      accountEmail = secret.credentials; // Fallback
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        
        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
        >
          {/* Logo Header */}
          {giveaway.image_url && (
             <div style={{ padding: '60px 32px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '160px', height: '160px', borderRadius: '36px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', background: '#000' }}>
                  <Image 
                    src={giveaway.image_url} 
                    alt={giveaway.title} 
                    fill
                    sizes="160px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
             </div>
          )}

          <div className={styles.cardHeader} style={{ paddingTop: giveaway.image_url ? '24px' : '40px' }}>
            <span className={styles.typeBadge}>{giveaway.type === 'ACCOUNT' ? 'Account' : 'VPN Key'}</span>
            <h1 className={styles.title}>{giveaway.title}</h1>
            <p className={styles.description}>{giveaway.description}</p>
          </div>

          {/* Info Table */}
          <div style={{ padding: '32px 24px' }}>
            <table className={styles.dataTable}>
              <tbody>
                <tr className={styles.dataRow}>
                  <td className={styles.dataLabel}>Status</td>
                  <td className={styles.dataValue}>
                    {giveaway.is_active ? (
                      <span className={styles.statusActive}>Active</span>
                    ) : (
                      <span className={styles.statusInactive}>Expired</span>
                    )}
                  </td>
                </tr>
                {metadataEntries.map(([key, value]) => (
                  <tr key={key} className={styles.dataRow}>
                    <td className={styles.dataLabel}>{key}</td>
                    <td className={styles.dataValue}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Protected Area: Credentials / Auth Wall */}
          {currentUser ? (
            <div className={styles.credentialsWrapper}>
              
              {giveaway.type === 'VPN_KEY' ? (
                <>
                  <div className={styles.credentialsTitle}>
                    <span>Connection Key / Credentials</span>
                    <span className={styles.copyLabel} onClick={() => handleCopy(secret?.credentials || '')} style={{ cursor: 'pointer' }}>Click to Copy</span>
                  </div>
                  <div className={styles.terminal} onClick={() => handleCopy(secret?.credentials || '')}>
                    {secret?.credentials || 'No credentials found.'}
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                   <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                         <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Email Address</div>
                         <div style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{accountEmail || 'N/A'}</div>
                      </div>
                      <button className="btn btn-ghost" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe' }} onClick={() => handleCopy(accountEmail)}>Copy Email</button>
                   </div>
                   <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                         <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Password</div>
                         <div style={{ fontSize: '16px', color: '#fff', fontFamily: 'monospace' }}>{accountPassword || 'N/A'}</div>
                      </div>
                      <button className="btn btn-ghost" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe' }} onClick={() => handleCopy(accountPassword)}>Copy Pass</button>
                   </div>
                </div>
              )}

            </div>
          ) : (
            <div className={styles.authWall}>
              <div className={styles.authWallIcon}>🔒</div>
              <h3>Sign in to Unlock</h3>
              <p>You need to be logged in to view the credentials.</p>
              <Link href={`/login?callbackUrl=/giveaways/${giveaway.id}`} className={styles.loginBtn}>
                Login Now
              </Link>
            </div>
          )}
        </motion.div>

        {/* Comments Section */}
        <div className={styles.commentsSection}>
          <h2>Comments</h2>
          
          {currentUser ? (
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <textarea 
                className={styles.commentInput} 
                placeholder="Ask a question or say thanks..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                maxLength={150}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {150 - commentText.length} chars left
                </span>
                <button type="submit" disabled={isSubmitting || !commentText.trim()} className={styles.submitBtn}>
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ color: '#94a3b8' }}>Please log in to participate in the conversation.</p>
            </div>
          )}

          <div className={styles.commentList}>
            {comments.map(comment => {
              const author = (comment.profile || (Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles)) as Record<string, unknown> | undefined;
              const isAdmin = author?.role === 'admin';
              const displayName = (author?.display_name as string) || 'Anonymous';
              const avatarUrl = author?.avatar_url as string | undefined;
              const nameTheme = author?.name_theme as string | undefined;
              const themeClass = nameTheme && nameTheme !== 'none' ? `name-theme-${nameTheme}` : '';

              return (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.avatar}>
                      {avatarUrl ? (
                         <Image src={avatarUrl} alt={displayName} fill sizes="40px" style={{ objectFit: 'cover' }} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={`${styles.commentAuthor} ${themeClass}`.trim()} style={{ color: themeClass ? undefined : (isAdmin ? '#a855f7' : '#f8fafc') }}>
                        {displayName}
                      </span>
                      <span className={styles.commentDate}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={styles.commentBody}>
                    {comment.comment_text}
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => handleDeleteComment(comment.id)} className={styles.deleteBtn}>
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
             {comments.length === 0 && (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No comments yet. Be the first!</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
