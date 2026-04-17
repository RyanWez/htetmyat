import { auth } from '@/lib/auth';
import AvatarUpload from '@/components/admin/AvatarUpload';
import NameThemeSelector from '@/components/admin/NameThemeSelector';
import SystemSettingsCard from '@/components/admin/SystemSettingsCard';
import { getProfileData } from './actions';
import { getSiteSettings } from '@/lib/settings';
import styles from './settings.module.css';

export default async function AdminSettingsPage() {
  const session = await auth();
  const currentAvatar = session?.user?.image || null;
  const profile = await getProfileData();
  const siteSettings = await getSiteSettings();

  return (
    <div className={styles.settingsPage}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <h1>Settings</h1>
        <p>Manage your profile, appearance, and system preferences.</p>
      </div>

      {/* ═══ Section 1: Public Profile ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <div className={`${styles.sectionIcon} ${styles.profile}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Public Profile</h2>
          <p>Your avatar and display name are visible across the site — in comments, leaderboards, and the admin panel.</p>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.profileCard}>
            {/* Gradient Banner */}
            <div className={styles.profileBanner} />

            {/* Profile Body */}
            <div className={styles.profileBody}>
              <AvatarUpload currentUrl={currentAvatar} size={104} showLabel={false} />

              <div className={styles.profileInfo}>
                <div className={styles.profileInfoRow}>
                  <span className={styles.profileInfoLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Display Name
                  </span>
                  <span className={`${styles.profileInfoValue} ${session?.user?.name_theme && session.user.name_theme !== 'none' ? `name-theme-${session.user.name_theme}` : ''}`}>
                    {session?.user?.name}
                  </span>
                </div>
                <div className={styles.profileInfoRow}>
                  <span className={styles.profileInfoLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    Email Address
                  </span>
                  <span className={styles.profileInfoValue}>{session?.user?.email}</span>
                </div>
                <div className={styles.profileInfoRow}>
                  <span className={styles.profileInfoLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Role
                  </span>
                  <span className={styles.profileInfoValue} style={{ textTransform: 'capitalize' }}>
                    {session?.user?.role || 'user'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 2: Name Theme ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <div className={`${styles.sectionIcon} ${styles.theme}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" />
              <circle cx="17.5" cy="10.5" r=".5" />
              <circle cx="8.5" cy="7.5" r=".5" />
              <circle cx="6.5" cy="12.5" r=".5" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
          </div>
          <h2>Name Theme</h2>
          <p>Add a premium visual effect to your display name. This appears in comments and wherever your name is shown.</p>
        </div>

        <div className={styles.sectionContent}>
          <NameThemeSelector currentTheme={profile?.name_theme || 'none'} />
        </div>
      </div>

      {/* ═══ Section 3: System Configuration ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <div className={`${styles.sectionIcon} ${styles.system}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h2>System</h2>
          <p>Global site behavior, maintenance mode, and security controls that affect all users.</p>
        </div>

        <div className={styles.sectionContent}>
          <SystemSettingsCard initialSettings={siteSettings} />
        </div>
      </div>
    </div>
  );
}
