import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AppleIdDetailClient from './apple-id-detail-client';

export const metadata = {
  title: 'Apple ID Details | HMA',
  description: 'View details and copy credentials for premium Apple IDs',
};

// Next.js 15+ dynamic route prop types
export default async function AppleIdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  
  if (!session) {
    redirect(`/login?callbackUrl=/apple-ids/${id}`);
  }

  return <AppleIdDetailClient id={id} />;
}
