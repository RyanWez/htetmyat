'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createUserAction } from './actions';

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  name_theme?: string;
}

export default function UsersClient({ initialUsers, totalCount }: { initialUsers: User[], totalCount: number }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter based on search input
  const filteredUsers = initialUsers.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort logic: Admin users always first, then chronologically (oldest first, newest at bottom)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // 1. Admin users always at the top
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;

    // 2. Earliest added user first, latest added user at bottom (ascending order)
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateA - dateB;
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

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
    <div style={{ width: '100%', position: 'relative' }}>
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{ 
              padding: '16px 20px', 
              background: 'var(--accent-success)', 
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

      <div className="header-container">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            User Management 
          </h1>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 4, fontSize: '0.95rem' }}>
            {totalCount} total registered {totalCount === 1 ? 'user' : 'users'} across the platform.
          </p>
        </div>
        
        <div className="actions-container">
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              🔍
            </span>
            <input 
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface-solid)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
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
              background: 'var(--brand-gradient)',
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
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>User Profile</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Joined</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🤷</div>
                    <p style={{ margin: 0 }}>No users found matching &quot;{search}&quot;</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
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
                          background: user.role === 'admin' ? 'var(--brand-gradient)' : 'var(--bg-elevated)', 
                          color: user.role === 'admin' ? '#fff' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1rem',
                          border: user.role === 'admin' ? 'none' : '1px solid var(--border-default)'
                        }}>
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={user.name_theme && user.name_theme !== 'none' ? `name-theme-${user.name_theme}` : ''} style={{ margin: 0, fontWeight: 600, color: (user.name_theme && user.name_theme !== 'none') ? undefined : 'var(--text-primary)' }}>{user.display_name || 'User Account'}</p>
                          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        background: user.role === 'admin' ? 'var(--brand-light)' : 'var(--bg-elevated)',
                        color: user.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${user.role === 'admin' ? 'var(--brand-primary)' : 'var(--border-default)'}`
                      }}>
                        {user.role === 'admin' ? <><span>👑</span><span>ADMIN</span></> : <><span>👤</span><span>USER</span></>}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          background: user.is_active ? 'var(--accent-success)' : 'var(--accent-danger)',
                          boxShadow: `0 0 10px ${user.is_active ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'}`
                        }} />
                        <span style={{ color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-tertiary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link 
                        href={`/admin/users/${user.id}`}
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-full)',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          border: '1px solid var(--border-default)'
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

        {/* Pagination section */}
        {sortedUsers.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-default)', 
            background: 'var(--bg-elevated)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 500 }}>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedUsers.length)} of {sortedUsers.length} users
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 28px 6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface-solid)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px top 50%',
                    backgroundSize: '10px auto',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: currentPage === 1 ? 'transparent' : 'var(--bg-surface-solid)',
                  color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: currentPage === 1 ? 'none' : 'var(--shadow-sm)'
                }}
                className={currentPage === 1 ? "" : "btn-glass"}
              >
                ← Previous
              </button>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 8px', fontWeight: 500 }}>
                    Page <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{totalPages}</strong>
                  </span>
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: currentPage === totalPages ? 'transparent' : 'var(--bg-surface-solid)',
                  color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: currentPage === totalPages ? 'none' : 'var(--shadow-sm)'
                }}
                className={currentPage === totalPages ? "" : "btn-glass"}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
              <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderBottom: '1px solid var(--border-default)' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ position: 'absolute', top: 20, right: 20, background: 'var(--bg-inset)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--border-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-inset)'}
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
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', background: 'var(--accent-danger-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                  <input name="email" type="email" required placeholder="name@example.com" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Secure Password</label>
                  <input name="password" type="password" required minLength={6} placeholder="••••••••" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Access Role</label>
                  <select name="role" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', outline: 'none', appearance: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}>
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
                    background: 'var(--brand-gradient)',
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
        
        .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4); }
        .actions-container { display: flex; gap: var(--space-4); width: 100%; max-width: 420px; }
        
        @media (max-width: 640px) {
          .header-container { flex-direction: column; align-items: stretch; margin-bottom: var(--space-6); }
          .actions-container { max-width: 100%; flex-direction: column; }
          .actions-container > div { width: 100%; }
          .actions-container button { width: 100%; justify-content: center; padding: 14px 20px !important; }
          .table-container td, .table-container th { padding: 16px !important; }
          .btn-glass { padding: 6px 12px !important; font-size: 0.75rem !important; }
        }
      `}} />
    </div>
  );
}
