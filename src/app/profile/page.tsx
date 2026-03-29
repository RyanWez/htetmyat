import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import { fetchMyProfile } from './actions';
import ProfileClient from './profile-client';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const result = await fetchMyProfile();

  if (!result.success || !result.data) {
    return (
      <div className="app-container">
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Profile Error</h2>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Unable to load your profile data. Please try again later.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
        <ProfileClient profile={result.data} />
      </main>
    </div>
  );
}
