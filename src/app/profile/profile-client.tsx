'use client';

import { useState, useTransition, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDisplayName, changePassword } from './actions';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AvatarUpload from '@/components/admin/AvatarUpload';
import Image from 'next/image';

interface ProfileData {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  display_name_changed_at: string | null;
  last_sign_in_at?: string;
}

export default function ProfileClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Display name
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Cooldown calculation for display name (admin always exempt)
  const COOLDOWN_DAYS = 7;
  const isAdmin = profile.role === 'admin';

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const cooldown = useMemo(() => {
    if (!now || isAdmin || !profile.display_name_changed_at) return null;
    const lastChanged = new Date(profile.display_name_changed_at);
    const diffMs = now - lastChanged.getTime();
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const remainingMs = cooldownMs - diffMs;
    if (remainingMs <= 0) return null;
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return { days, hours, totalMs: remainingMs };
  }, [isAdmin, profile.display_name_changed_at, now, COOLDOWN_DAYS]);

  const clearMessages = useCallback(() => { setError(''); setSuccess(''); }, []);

  // Auto-dismiss messages after 3 seconds
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (error || success) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(clearMessages, 3000);
    }
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [error, success, clearMessages]);

  const handleUpdateName = () => {
    clearMessages();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    startTransition(async () => {
      const res = await updateDisplayName(displayName);
      if (res.success) {
        setSuccess('Display name updated successfully');
        setIsEditingName(false);
        router.refresh(); // Force server data to sync with UI
      } else {
        setError(res.error || 'Failed to update display name');
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    startTransition(async () => {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        setError(res.error || 'Failed to change password');
      }
    });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 var(--space-4)' }}>
      {/* Alert Messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            style={{
              padding: '16px 20px',
              background: error ? 'var(--accent-danger-light)' : 'var(--accent-success-light)',
              color: error ? 'var(--accent-danger)' : 'var(--accent-success)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-6)',
              boxShadow: error ? 'none' : 'var(--shadow-md)',
              display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600
            }}
          >
            <span style={{ fontSize: 20 }}>{error ? '⚠️' : '✨'}</span>
            {error || success}
            <button
              onClick={clearMessages}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'inherit', cursor: 'pointer', fontSize: 18, padding: 4,
                opacity: 0.7, lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Banner Card */}
        <div
          className="glass-card profile-banner-card"
          style={{
            padding: 0, overflow: 'hidden',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div style={{ height: 120, background: 'var(--brand-gradient)', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: -40, left: 32,
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--bg-surface-solid)', padding: 6,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10,
            overflow: 'hidden'
          }}>
            {isAdmin ? (
               <AvatarUpload currentUrl={profile.avatar_url} size={88} showLabel={false} />
            ) : (
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--brand-primary)', fontSize: 36, fontWeight: 800,
                overflow: 'hidden'
              }}>
                {profile.avatar_url ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      fill
                      sizes="100px"
                      unoptimized={profile.avatar_url.toLowerCase().includes('.gif')}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  profile.email?.[0].toUpperCase()
                )}
              </div>
            )}
          </div>
          </div>
          <div className="profile-banner-content">
            <div>
              <h1
                className="profile-banner-title"
                style={{
                  fontSize: 'var(--text-3xl)', fontWeight: 800,
                  margin: '0 0 4px 0', letterSpacing: '-0.02em',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {profile.display_name || 'System User'}
                <span style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  verticalAlign: 'middle',
                  background: profile.role === 'admin' ? 'var(--brand-light)' : 'var(--bg-elevated)',
                  color: profile.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${profile.role === 'admin' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                }}>
                  {profile.role}
                </span>
              </h1>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '1rem' }}>
                {profile.email}
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: profile.is_active ? 'var(--accent-success)' : 'var(--accent-danger)',
                boxShadow: `0 0 10px ${profile.is_active ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'}`,
              }} />
              <span style={{
                color: profile.is_active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.9rem',
              }}>
                {profile.is_active ? 'Account Active' : 'Account Suspended'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          {[
            {
              label: 'User ID',
              value: profile.id.split('-')[0] + '••••',
              full: profile.id,
              icon: '🆔',
            },
            {
              label: 'Member Since',
              value: new Date(profile.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              }),
              icon: '📅',
            },
            {
              label: 'Last Sign In',
              value: profile.last_sign_in_at
                ? new Date(profile.last_sign_in_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : 'Never',
              icon: '🕒',
            },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              key={stat.label}
              className="glass-card"
              style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}
            >
              <div style={{
                fontSize: 28, background: 'var(--bg-elevated)',
                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
              <div>
                <h3 style={{
                  fontSize: '0.75rem', textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-tertiary)',
                  margin: '0 0 4px 0', fontWeight: 700,
                }}>
                  {stat.label}
                </h3>
                <p
                  style={{
                    margin: 0, color: 'var(--text-primary)',
                    fontWeight: 600, fontSize: '1.05rem',
                  }}
                  title={stat.full || stat.value}
                >
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            display: 'flex', flexDirection: 'column',
            gap: 'var(--space-4)', marginBottom: 'var(--space-8)',
          }}
        >
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 700,
            margin: '0 0 8px 0', color: 'var(--text-primary)',
          }}>
            Profile Settings
          </h2>

          {/* Display Name */}
          <div className="glass-card profile-action-card">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>
                Display Name
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>
                This is the name visible throughout the platform.
              </p>
            </div>
            {cooldown ? (
              /* Cooldown active — show remaining time */
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                background: 'var(--accent-info-light)',
                border: '1px solid var(--accent-info)',
                color: 'var(--accent-info)',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                <span style={{ fontSize: 16 }}>⏳</span>
                {cooldown.days > 0
                  ? `${cooldown.days} day${cooldown.days > 1 ? 's' : ''}, ${cooldown.hours} hour${cooldown.hours !== 1 ? 's' : ''}`
                  : `${cooldown.hours} hour${cooldown.hours !== 1 ? 's' : ''}`
                } remaining
              </div>
            ) : isEditingName ? (
              <div className="profile-action-form">
                <input
                  type="text"
                  className="input-field"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  disabled={isPending}
                  maxLength={50}
                  style={{ flex: 1, minWidth: 0 }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setDisplayName(profile.display_name || '');
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateName}
                    disabled={isPending || !displayName.trim()}
                    style={{ opacity: isPending || !displayName.trim() ? 0.6 : 1 }}
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(profile.display_name || '');
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditingName(true)}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {/* Email (Read Only) */}
          <div className="glass-card profile-action-card">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>
                Email Address
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Your login email cannot be changed.
              </p>
            </div>
            <span style={{
              padding: '10px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              fontSize: '0.9rem', fontWeight: 600,
              border: '1px solid var(--border-default)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '280px',
            }}>
              {profile.email}
            </span>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex', flexDirection: 'column',
            gap: 'var(--space-4)', marginBottom: 'var(--space-8)',
          }}
        >
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 700,
            margin: '0 0 8px 0', color: 'var(--text-primary)',
          }}>
            Security
          </h2>

          <div className="glass-card profile-action-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>
                  Change Password
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  Update your account password. You&apos;ll need your current password.
                </p>
              </div>
              {!showPasswordForm && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPasswordForm(true)}
                >
                  🔐 Change
                </button>
              )}
            </div>

            <AnimatePresence>
              {showPasswordForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleChangePassword}
                  className="profile-password-form"
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-default)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                  }}>
                    <div>
                      <label className="input-label" htmlFor="current-password">Current Password</label>
                      <input
                        id="current-password"
                        type="password"
                        className="input-field"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        disabled={isPending}
                        autoComplete="current-password"
                      />
                    </div>
                    <div>
                      <label className="input-label" htmlFor="new-password">New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        className="input-field"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="input-label" htmlFor="confirm-password">Confirm New Password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        className="input-field"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          clearMessages();
                        }}
                        disabled={isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
                        style={{
                          opacity: (isPending || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                        }}
                      >
                        {isPending ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: 'flex', flexDirection: 'column',
            gap: 'var(--space-4)', marginBottom: 'var(--space-8)',
          }}
        >
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 700,
            margin: '0 0 8px 0', color: 'var(--text-primary)',
          }}>
            Session
          </h2>

          <div className="glass-card profile-action-card">
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Sign Out</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>
                End your current session and return to the login page.
              </p>
            </div>
            <button
              className="btn btn-sm"
              onClick={handleSignOut}
              style={{
                background: 'var(--accent-warning-light)',
                color: 'var(--accent-warning)',
                fontWeight: 700,
                border: '1px solid var(--accent-warning)',
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .profile-banner-card:hover { transform: none !important; }

        .profile-banner-content {
          padding: 56px 32px 32px 32px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .profile-action-card {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }
        .profile-action-card:hover { transform: none !important; }

        .profile-action-form {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          flex: 1;
          min-width: 0;
          max-width: 400px;
        }

        @media (max-width: 640px) {
          .profile-banner-content {
            padding: 56px 20px 24px 20px;
            flex-direction: column;
            gap: 16px;
          }
          .profile-banner-title {
            font-size: 1.5rem !important;
            flex-wrap: wrap;
          }
          .profile-stats-grid {
            grid-template-columns: 1fr;
            margin-bottom: var(--space-6);
          }
          .profile-action-card {
            flex-direction: column;
            align-items: stretch;
            text-align: left;
            padding: 20px;
            gap: 16px;
          }
          .profile-action-form {
            max-width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .profile-action-form .btn {
            width: 100%;
          }
          .profile-action-card > span {
            max-width: 100% !important;
          }
          .profile-action-card > button {
            width: 100%;
          }
          .profile-password-form .btn {
            width: 100%;
          }
          .profile-password-form > div:last-child > div:last-child {
            flex-direction: column;
          }
        }
      `}} />
    </div>
  );
}
