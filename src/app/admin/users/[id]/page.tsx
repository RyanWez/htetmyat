import { fetchUserById } from '../actions';
import UserDetailClient from '@/app/admin/users/[id]/user-detail-client';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'User Details - HMA Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: user, success, error } = await fetchUserById(id);

  if (!success || !user) {
    console.error('User Not Found or Error:', error);
    notFound();
  }

  return <UserDetailClient user={user} />;
}
