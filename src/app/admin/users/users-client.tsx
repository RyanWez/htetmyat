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
        setSuccessMsg('User created successfully. They can now login.');
        setIsModalOpen(false);
        formRef.current?.reset();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to create user');
      }
    });
  }

  return (
    <div style={{ maxWidth: 1040, position: 'relative', margin: '0 auto' }}>
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, var(--success-main) 0%, #10B981 100%)', 
              color: '#fff', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: 'var(--space-6)',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              gap: 12
            }}
          >
            <span style={{ fontSize: 20 }}>✨</span> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            User Management 
          </h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 4, fontSize: '0.95rem' }}>
            {totalCount} total registered {totalCount === 1 ? 'user' : 'users'} across the platform.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)', width: '100%', maxWidth: 420 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              🔍
            </span>
            <input 
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(147, 51, 234, 0.15), inset 0 2px 4px rgba(0,0,0,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-default)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
              }}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
              color: 'white',
              border: 'none',
              padding: '0 20px',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px -6px var(--brand-glow)'
            }}
          >
            ➕ Add User
          </motion.button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>User Profile</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Joined</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🤷</div>
                    <p style={{ margin: 0 }}>No users found matching "{search}"</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={user.id} 
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background 0.2s ease' }} 
                    className="hover-row"
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <Link href={`/admin/users/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', 
                          background: user.role === 'admin' ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'var(--bg-surface-hover)', 
                          color: user.role === 'admin' ? '#fff' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1rem',
                          border: user.role === 'admin' ? 'none' : '1px solid var(--border-default)'
                        }}>
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{user.display_name || 'User Account'}</p>
                          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        background: user.role === 'admin' ? 'rgba(147, 51, 234, 0.15)' : 'var(--bg-surface-hover)',
                        color: user.role === 'admin' ? '#D8B4FE' : 'var(--text-secondary)',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(147, 51, 234, 0.3)' : 'var(--border-default)'}`
                      }}>
                        {user.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          background: user.is_active ? 'var(--success-main)' : 'var(--error-main)',
                          boxShadow: `0 0 10px ${user.is_active ? 'var(--success-main)' : 'var(--error-main)'}`
                        }} />
                        <span style={{ color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                      {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link 
                        href={`/admin/users/${user.id}`}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-primary)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-full)',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        className="btn-glass"
                      >
                        Manage
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ 
                position: 'relative', width: '100%', maxWidth: 440, padding: 0, zIndex: 101, 
                background: 'var(--bg-surface-solid)', borderRadius: 'var(--radius-xl)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                border: '1px solid var(--border-default)',
                overflow: 'hidden'
              }}
            >
              <div style={{ background: 'var(--bg-surface-hover)', padding: '24px', borderBottom: '1px solid var(--border-default)' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  ✕
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>✨</span> Create User
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  User will be automatically verified and ready to login.
                </p>
              </div>

              <form action={handleCreate} ref={formRef} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--error-main)', fontSize: '0.9rem', background: 'var(--error-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                  <input name="email" type="email" required placeholder="name@example.com" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Secure Password</label>
                  <input name="password" type="password" required minLength={6} placeholder="••••••••" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Access Role</label>
                  <select name="role" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}>
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isPending}
                  style={{
                    marginTop: 8,
                    padding: '14px',
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    boxShadow: '0 8px 16px -4px var(--brand-glow)'
                  }}
                >
                  {isPending ? 'Generating Account...' : 'Create Account Now'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-row:hover { background-color: var(--bg-surface-hover) !important; }
        .btn-glass:hover { background-color: rgba(255,255,255,0.1) !important; }
      `}} />
    </div>
  );
}
