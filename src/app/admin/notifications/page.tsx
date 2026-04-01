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
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', color: 'var(--text-primary)' }}>
        Notification Settings
      </h1>
      <NotificationsClient initialTemplates={templates} />
    </div>
  );
}
