import { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'HMA — Premium Free Apple IDs',
  description: 'Gain instant access to our managed, updated, and highly secure Apple IDs. Download your favorite iOS apps securely, without boundaries.',
  keywords: ['apple ids', 'free apple id', 'ios', 'app store account'],
};

export default function HomePage() {
  return <HomeClient />;
}
