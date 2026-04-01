import { fetchTemplates } from './actions';
import NotificationsClient from './notifications-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications - HMA Admin',
};

export default async function NotificationsPage() {
  const result = await fetchTemplates();
  const templates = result.success && result.data ? result.data : [];

  return (
    <div className="admin-page-container">
      <div className="section-header">
        <h1>Notification Settings</h1>
        <p className="subtitle">Manage system notifications, broadcast messages, and auto-reply templates.</p>
      </div>
      
      <div style={{ marginTop: 'var(--space-6)' }}>
        <NotificationsClient initialTemplates={templates} />
      </div>
    </div>
  );
}
