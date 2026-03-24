'use client';

import { motion } from 'framer-motion';

export default function BlogPage() {
  return (
    <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          📰 Blog
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
          iOS tutorials, tips, and guides coming soon.
        </p>

        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-4)',
            color: 'var(--text-tertiary)',
          }}
        >
          <span style={{ fontSize: 48, display: 'block', marginBottom: 'var(--space-4)' }}>📝</span>
          <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            Coming Soon
          </h3>
          <p style={{ fontSize: 'var(--text-sm)' }}>Blog posts will be available soon.</p>
        </div>
      </motion.div>
    </div>
  );
}
