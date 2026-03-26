'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createUserAction } from './actions';

export default function UsersClient({ initialUsers, totalCount }: { initialUsers: any[], totalCount: number }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const filteredUsers = initialUsers.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(formData: FormData) {
    setError('');
    setSuccessMsg('');
    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res.success) {
        setSuccessMsg('User created successfully');
        setIsModalOpen(false);
        formRef.current?.reset();
        // Hide success message after 3 seconds
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.error || 'Failed to create user');
      }
    });
  }

  return (
    <div style={{ maxWidth: 1000, position: 'relative' }}>
      {successMsg && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
            User List 
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'normal', color: 'var(--text-tertiary)', marginLeft: 12 }}>
              Total: {totalCount}
            </span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-tertiary)' }}>🔍</span>
            <input 
              type="text"
              placeholder="Search users by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface-solid)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ➕ Add User
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</th>
                <th style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</th>
                <th style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontWeight: 600 }}>Joined</th>
                <th style={{ padding: 'var(--space-4)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: 'var(--space-4)', fontWeight: 500 }}>
                      <Link href={`/admin/users/${user.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                        {user.email}
                      </Link>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: user.role === 'admin' ? 'var(--brand-light)' : 'var(--bg-surface-hover)',
                        color: user.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                      }}>
                        {user.role === 'admin' ? '⭐ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{ color: user.is_active ? 'var(--success-main)' : 'var(--error-main)' }}>
                        {user.is_active ? '● Active' : '○ Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <Link 
                        href={`/admin/users/${user.id}`}
                        style={{
                          background: 'var(--bg-surface-hover)',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card"
              style={{ position: 'relative', width: '100%', maxWidth: 450, padding: 'var(--space-6)', zIndex: 101, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                ✕
              </button>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Create New User</h2>
              <form action={handleCreate} ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {error && <div style={{ color: 'var(--error-main)', fontSize: '0.9rem', background: 'var(--error-light)', padding: 8, borderRadius: 4 }}>{error}</div>}
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
                  <input name="email" type="email" required placeholder="admin@example.com" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
                  <input name="password" type="password" required minLength={6} placeholder="••••••••" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Role</label>
                  <select name="role" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)' }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isPending}
                  style={{
                    marginTop: 'var(--space-2)',
                    padding: 12,
                    background: 'var(--brand-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1
                  }}
                >
                  {isPending ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background-color: var(--bg-surface-hover); }
      `}} />
    </div>
  );
}
