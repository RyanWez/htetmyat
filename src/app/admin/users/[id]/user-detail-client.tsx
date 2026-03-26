'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserRole, updateUserStatus, deleteUser } from '../actions';

export default function UserDetailClient({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
            padding: '8px 16px', background: 'var(--bg-surface-hover)',
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
              background: error ? 'var(--error-light)' : 'linear-gradient(135deg, var(--success-main) 0%, #10B981 100%)', 
              color: error ? 'var(--error-main)' : '#fff', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: 'var(--space-6)',
              boxShadow: error ? 'none' : '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
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
          <div style={{ height: 120, background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -40, left: 32, width: 90, height: 90, borderRadius: '50%', background: 'var(--bg-surface-solid)', padding: 6, boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', fontSize: 36, fontWeight: 800 }}>
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ padding: '56px 32px 32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                {user.display_name || 'System User'}
                <span style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', verticalAlign: 'middle',
                  background: user.role === 'admin' ? 'rgba(147, 51, 234, 0.15)' : 'var(--bg-surface-hover)',
                  color: user.role === 'admin' ? '#D8B4FE' : 'var(--text-secondary)',
                  border: `1px solid ${user.role === 'admin' ? 'rgba(147, 51, 234, 0.3)' : 'var(--border-default)'}`
                }}>
                  {user.role}
                </span>
              </h1>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '1rem' }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: user.is_active ? 'var(--success-main)' : 'var(--error-main)', boxShadow: `0 0 10px ${user.is_active ? 'var(--success-main)' : 'var(--error-main)'}` }} />
              <span style={{ color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                {user.is_active ? 'Account Active' : 'Account Suspended'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
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
              <div style={{ fontSize: 28, background: 'var(--bg-surface-hover)', width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          
          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Role Permissions</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Elevate or restrict this user's administrative privileges.</p>
            </div>
            <select 
              value={user.role} 
              onChange={handleRoleChange}
              disabled={isPending}
              style={{ 
                padding: '12px 20px', borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-default)', background: 'rgba(0,0,0,0.2)', 
                color: 'var(--text-primary)', fontWeight: 600, outline: 'none',
                opacity: isPending ? 0.7 : 1, cursor: isPending ? 'wait' : 'pointer'
              }}
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Account Status</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Temporarily suspend access without deleting the account.</p>
            </div>
            <button 
              onClick={handleStatusToggle}
              disabled={isPending}
              style={{ 
                padding: '12px 24px', borderRadius: 'var(--radius-md)', border: 'none', 
                background: user.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                color: user.is_active ? 'var(--error-main)' : 'var(--success-main)', 
                fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
                transition: 'all 0.2s', boxShadow: 'inset 0 0 0 1px currentColor'
              }}
            >
              {user.is_active ? 'Suspend Account' : 'Reactivate Account'}
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
          <h3 style={{ color: 'var(--error-main)', fontWeight: 800, margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Danger Zone
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-tertiary)', margin: '0 0 24px 0', maxWidth: 600 }}>
            Permanently delete this user and all of their associated data. This action cannot be undone and they will immediately lose access.
          </p>
          <button 
            onClick={handleDelete}
            disabled={isPending}
            style={{ 
              padding: '12px 24px', borderRadius: 'var(--radius-lg)', 
              background: 'var(--error-main)', color: '#fff', border: 'none',
              fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)', transition: 'transform 0.2s',
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
      `}} />
    </div>
  );
}
