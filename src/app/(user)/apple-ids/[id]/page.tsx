import AppleIdDetailClient from './apple-id-detail-client';

export const metadata = {
  title: 'Apple ID Details | HMA',
  description: 'View details and copy credentials for premium Apple IDs',
};

// Next.js 15+ dynamic route prop types
export default async function AppleIdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppleIdDetailClient id={id} />;
}
