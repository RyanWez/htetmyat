'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    if (secret?.credentials) {
      navigator.clipboard.writeText(secret.credentials);
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
      
      // Optimistic update
      if (currentUser) {
        const newComment = {
          id: Math.random().toString(),
          giveaway_id: giveaway.id,
          user_id: currentUser.id,
          comment_text: commentText,
          created_at: new Date().toISOString(),
          parent_id: null,
          profile: {
            id: currentUser.id,
            display_name: currentUser.name || 'User',
            avatar_url: currentUser.image || '',
            role: currentUser.role || ''
          }
        };
        setComments([newComment, ...comments]);
      }
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

  // Convert metadata object into array of [key, value]
  const metadataEntries = giveaway.metadata ? Object.entries(giveaway.metadata) : [];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        
        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
        >
          <div className={styles.cardHeader}>
            <span className={styles.typeBadge}>{giveaway.type}</span>
            <h1 className={styles.title}>{giveaway.title}</h1>
            <p className={styles.description}>{giveaway.description}</p>
          </div>

          {/* QR Code Section (Only if Secret is Available) */}
          {secret?.qr_code_url && (
            <div className={styles.qrContainer}>
              <div className={styles.qrFrame}>
                <Image src={secret.qr_code_url} alt="QR Code" width={200} height={200} />
              </div>
            </div>
          )}

          {/* Info Table */}
          <div style={{ padding: '0 24px' }}>
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
              <div className={styles.credentialsTitle}>
                <span>Connection Key / Credentials</span>
                <span className={styles.copyLabel}>Click to Copy</span>
              </div>
              <div className={styles.terminal} onClick={handleCopy}>
                {secret?.credentials || 'No credentials found.'}
              </div>
            </div>
          ) : (
            <div className={styles.authWall}>
              <div className={styles.authWallIcon}>🔒</div>
              <h3>Sign in to Unlock</h3>
              <p>You need to be logged in to view the QR code and credentials.</p>
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

              return (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.avatar}>
                      {avatarUrl ? (
                         <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={styles.commentAuthor} style={{ color: isAdmin ? '#a855f7' : '#f8fafc' }}>
                        {displayName} {isAdmin && <span style={{ fontSize: '12px', background: 'rgba(168,85,247,0.2)', padding:'2px 6px', borderRadius:'4px' }}>Admin</span>}
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
