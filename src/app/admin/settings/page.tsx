import { auth } from '@/lib/auth';
import AvatarUpload from '@/components/admin/AvatarUpload';
import NameThemeSelector from '@/components/admin/NameThemeSelector';
import SystemSettingsCard from '@/components/admin/SystemSettingsCard';
import { getProfileData } from './actions';
import { getSiteSettings } from '@/lib/settings';

export default async function AdminSettingsPage() {
  const session = await auth();
  const currentAvatar = session?.user?.image || null;
  const profile = await getProfileData();
  const siteSettings = await getSiteSettings();

  return (
    <div className="admin-page-container">
      <div className="section-header">
        <h1>Admin Settings</h1>
        <p className="subtitle">Manage your profile, account security, and dashboard preferences.</p>
      </div>
      
      <div className="admin-settings-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Public Profile</h2>
          <AvatarUpload currentUrl={currentAvatar} />
          
          <div style={{ width: '100%', marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Full Name</span>
              <span className={session?.user?.name_theme && session.user.name_theme !== 'none' ? `name-theme-${session.user.name_theme}` : ''} style={{ fontWeight: 600, color: (session?.user?.name_theme && session.user.name_theme !== 'none') ? undefined : 'var(--text-primary)' }}>{session?.user?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Email Address</span>
              <span style={{ fontWeight: 600 }}>{session?.user?.email}</span>
            </div>
          </div>

          {/* Theme Selector UI */}
          <NameThemeSelector currentTheme={profile?.name_theme || 'none'} />
        </div>

        {/* System Settings & Maintenance */}
        <SystemSettingsCard initialSettings={siteSettings} />
      </div>
    </div>
  );
}

