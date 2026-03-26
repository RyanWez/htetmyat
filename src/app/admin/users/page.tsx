import { fetchAllUsers } from './actions';
import UsersClient from './users-client';

export const metadata = {
  title: 'User Management - HMA Admin',
};

export default async function AdminUsersPage() {
  const { data: users, count, success, error } = await fetchAllUsers();

  if (!success) {
    return (
      <div style={{ padding: 'var(--space-8)', color: 'var(--error-main)' }}>
        <h2>Error Loading Users</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <UsersClient initialUsers={users || []} totalCount={count || 0} />;
}
