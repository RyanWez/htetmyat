import { Metadata } from 'next';
import AppleIdsClient from './apple-ids-client';

export const metadata: Metadata = {
  title: 'Free Apple IDs Library — HMA',
  description: 'Browse our extensive library of shared Apple IDs to download any premium or region-locked iOS app instantly. Daily updated.',
};

export default function AppleIdsPage() {
  return <AppleIdsClient />;
}
