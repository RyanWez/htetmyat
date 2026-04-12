import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSiteSettings } from '@/lib/settings';
import { auth } from '@/lib/auth';
import MaintenanceScreen from '@/components/layout/MaintenanceScreen';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const session = await auth();

  const isMaintenanceMode = settings.maintenance_mode;
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {isMaintenanceMode && !isAdmin ? (
          <MaintenanceScreen message={settings.maintenance_message} endTime={settings.maintenance_end_time} />
        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
}
