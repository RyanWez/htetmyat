'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
      if (res.success) setSuccess('Role updated successfully');
      else setError(res.error || 'Failed to update role');
    });
  };

  const handleStatusToggle = () => {
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await updateUserStatus(user.id, !user.is_active);
      if (res.success) setSuccess('Status updated successfully');
      else setError(res.error || 'Failed to update status');
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
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/admin/users" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
          ← Back to User List
        </Link>
      </div>

      {(error || success) && (
        <div style={{ 
          padding: 'var(--space-4)', 
          background: error ? 'var(--error-light)' : 'var(--success-light)', 
          color: error ? 'var(--error-main)' : 'var(--success-dark)', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: 'var(--space-6)' 
        }}>
          {error || success}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-6)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0 }}>{user.display_name || 'User'}</h1>
            <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>User ID</h3>
            <p style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{user.id}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>Account Created</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{new Date(user.created_at).toLocaleString()}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>Last Sign-in</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-6)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>User Role</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Change the privileges of this user.</p>
            </div>
            <div>
              <select 
                value={user.role} 
                onChange={handleRoleChange}
                disabled={isPending}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', fontWeight: 500, opacity: isPending ? 0.7 : 1 }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Account Status</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Suspend this user to prevent them from logging in.</p>
            </div>
            <div>
              <button 
                onClick={handleStatusToggle}
                disabled={isPending}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  background: user.is_active ? 'var(--error-light)' : 'var(--success-light)', 
                  color: user.is_active ? 'var(--error-main)' : 'var(--success-dark)', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  opacity: isPending ? 0.7 : 1 
                }}
              >
                {user.is_active ? 'Suspend User' : 'Activate User'}
              </button>
            </div>
          </div>

        </div>

        <div style={{ marginTop: 'var(--space-12)', borderTop: '1px solid var(--error-light)', paddingTop: 'var(--space-6)' }}>
          <h3 style={{ color: 'var(--error-main)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
            Once you delete a user, there is no going back. Please be certain.
          </p>
          <button 
            onClick={handleDelete}
            disabled={isPending}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--error-main)', 
              background: 'transparent', 
              color: 'var(--error-main)', 
              fontWeight: 600, 
              cursor: 'pointer',
              opacity: isPending ? 0.7 : 1 
            }}
          >
            Delete User Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
