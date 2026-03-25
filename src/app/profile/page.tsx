import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content flex-center">
        <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-gradient)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
            margin: '0 auto 1.5rem auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            {session.user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{session.user.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{session.user.email}</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span style={{
              background: 'var(--bg-elevated)', padding: '0.25rem 0.75rem', 
              borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500,
              color: session.user.role === 'admin' ? '#ef4444' : 'var(--brand-primary)'
            }}>
              ROLE: {session.user.role?.toUpperCase() || 'USER'}
            </span>
          </div>

          <p style={{ color: 'var(--text-tertiary)', marginTop: '2rem', fontSize: '0.875rem' }}>
            Profile editing is currently under development.
          </p>
        </div>
      </main>
    </div>
  );
}
