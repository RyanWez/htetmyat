'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserRole, updateUserStatus, deleteUser, updateUserPassword } from '../actions';

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

export default function UserDetailClient({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await updateUserRole(user.id, newRole);
      if (res.success) setSuccess('Access privileges updated successfully');
      else setError(res.error || 'Failed to update access privileges');
    });
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(''); setSuccess('');
    setIsResetting(true);
    startTransition(async () => {
      const res = await updateUserPassword(user.id, newPassword);
      setIsResetting(false);
      if (res.success) {
        setSuccess('Password updated successfully');
        setNewPassword('');
      } else {
        setError(res.error || 'Failed to update password');
      }
    });
  };

  const handleStatusToggle = () => {
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await updateUserStatus(user.id, !user.is_active);
      if (res.success) setSuccess(user.is_active ? 'Account suspended successfully' : 'Account activated successfully');
      else setError(res.error || 'Failed to update account status');
    });
  };

  const handleDelete = () => {
    if (confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) {
      setError(''); setSuccess('');
      startTransition(async () => {
        const res = await deleteUser(user.id);
        if (res.success) {
          router.push('/admin/users');
        } else {
          setError(res.error || 'Failed to delete user');
        }
      });
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link 
          href="/admin/users" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--text-tertiary)', textDecoration: 'none', 
            fontWeight: 600, fontSize: '0.9rem',
            padding: '8px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)', transition: 'all 0.2s'
          }}
          className="back-btn"
        >
          <span>←</span> Back to Directory
        </Link>
      </div>

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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Banner Card */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-8)' }}>
          <div style={{ height: 120, background: 'var(--brand-gradient)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -40, left: 32, width: 90, height: 90, borderRadius: '50%', background: 'var(--bg-surface-solid)', padding: 6, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', fontSize: 36, fontWeight: 800 }}>
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div className="banner-content">
            <div>
              <h1 className="banner-content-title" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                {user.display_name || 'System User'}
                <span style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', verticalAlign: 'middle',
                  background: user.role === 'admin' ? 'var(--brand-light)' : 'var(--bg-elevated)',
                  color: user.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${user.role === 'admin' ? 'var(--brand-primary)' : 'var(--border-default)'}`
                }}>
                  {user.role}
                </span>
              </h1>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '1rem' }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: user.is_active ? 'var(--accent-success)' : 'var(--accent-danger)', boxShadow: `0 0 10px ${user.is_active ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'}` }} />
              <span style={{ color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                {user.is_active ? 'Account Active' : 'Account Suspended'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {[
            { label: 'System ID', value: user.id.split('-')[0] + '••••', full: user.id, icon: '🆔' },
            { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
            { label: 'Last Activity', value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never logged in', icon: '🕒' }
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.05) }}
              key={stat.label} 
              className="glass-card" 
              style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}
            >
              <div style={{ fontSize: 28, background: 'var(--bg-elevated)', width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: '0 0 4px 0', fontWeight: 700 }}>{stat.label}</h3>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem' }} title={stat.full || stat.value}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Settings Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Access & Security</h2>
          
          <div className="glass-card action-card">
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Role Permissions</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Elevate or restrict this user&apos;s administrative privileges.</p>
            </div>
            <select 
              value={user.role} 
              onChange={handleRoleChange}
              disabled={isPending}
              style={{ 
                padding: '12px 20px', borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', 
                color: 'var(--text-primary)', fontWeight: 600, outline: 'none',
                opacity: isPending ? 0.7 : 1, cursor: isPending ? 'wait' : 'pointer'
              }}
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="glass-card action-card">
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Account Status</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Temporarily suspend access without deleting the account.</p>
            </div>
            <button 
              onClick={handleStatusToggle}
              disabled={isPending}
              style={{ 
                padding: '12px 24px', borderRadius: 'var(--radius-md)', border: 'none', 
                background: user.is_active ? 'var(--accent-danger-light)' : 'var(--accent-success-light)', 
                color: user.is_active ? 'var(--accent-danger)' : 'var(--accent-success)', 
                fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
                transition: 'all 0.2s', boxShadow: 'inset 0 0 0 1px currentColor'
              }}
            >
              {user.is_active ? 'Suspend Account' : 'Reactivate Account'}
            </button>
          </div>

          <div className="glass-card action-card" style={{ marginTop: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Reset Password</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Set a new password for this user immediately without email verification.</p>
            </div>
            <form onSubmit={handlePasswordReset} className="action-form">
              <input 
                type="text" 
                placeholder="New Password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isPending || isResetting}
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button 
                type="submit"
                disabled={isPending || isResetting || !newPassword}
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--brand-gradient)', color: '#fff', fontWeight: 600, cursor: (isPending || isResetting || !newPassword) ? 'not-allowed' : 'pointer', opacity: (isPending || isResetting || !newPassword) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
              >
                {isResetting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="danger-zone" style={{ background: 'var(--accent-danger-light)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
          <h3 style={{ color: 'var(--accent-danger)', fontWeight: 800, margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Danger Zone
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', maxWidth: 600 }}>
            Permanently delete this user and all of their associated data. This action cannot be undone and they will immediately lose access.
          </p>
          <button 
            onClick={handleDelete}
            disabled={isPending}
            style={{ 
              padding: '12px 24px', borderRadius: 'var(--radius-lg)', 
              background: 'var(--accent-danger)', color: '#fff', border: 'none',
              fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
              boxShadow: '0 4px 12px var(--shadow-sm)', transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Permanently Delete User
          </button>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .back-btn:hover { background: rgba(255,255,255,0.1) !important; color: var(--text-primary) !important; transform: translateX(-4px); }
        
        .banner-content { padding: 56px 32px 32px 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8); }
        .action-card { padding: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
        .action-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        
        @media (max-width: 640px) {
          .banner-content { padding: 56px 20px 24px 20px; flex-direction: column; gap: 16px; }
          .banner-content-title { font-size: 1.5rem !important; flex-wrap: wrap; }
          .stats-grid { grid-template-columns: 1fr; margin-bottom: var(--space-6); }
          .action-card { flex-direction: column; align-items: stretch; text-align: left; padding: 20px; gap: 16px; }
          .action-form { flex-direction: column; align-items: stretch; }
          .action-card button, .action-card select, .action-form input { width: 100%; box-sizing: border-box; }
          .action-form button { margin-top: 8px; }
          .danger-zone { padding: 24px !important; }
          .danger-zone button { width: 100%; }
        }
      `}} />
    </div>
  );
}
