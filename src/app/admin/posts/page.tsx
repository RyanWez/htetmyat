
export default function AdminPostsPage() {
  return (
    <div className="admin-page-container">
      <div className="section-header">
        <h1>Posts Management</h1>
        <p className="subtitle">Manage blog posts and articles.</p>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Coming Soon</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          This module is currently under development. Please check back later.
        </p>
      </div>
    </div>
  );
}
