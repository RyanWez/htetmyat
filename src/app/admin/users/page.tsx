'use client';

import { motion } from 'framer-motion';

export default function AdminUsersPage() {
  return (
    <div style={{ maxWidth: 960 }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          👥 User Management
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Manage user accounts.
        </p>

        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
          }}
        >
          <span style={{ fontSize: 48, display: 'block', marginBottom: 'var(--space-4)' }}>👥</span>
          <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            Coming Soon
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            User management will be available in the next update.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
