import { Metadata } from 'next';
import HomeClient from './home-client';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'HMA — Premium Free Apple IDs',
  description: 'Gain instant access to our managed, updated, and highly secure Apple IDs. Download your favorite iOS apps securely, without boundaries.',
  keywords: ['apple ids', 'free apple id', 'ios', 'app store account'],
};

export const revalidate = 60;


export default async function HomePage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('apple_ids')
    .select('*', { count: 'exact', head: true });

  const totalCount = count || 0;

  return <HomeClient totalCount={totalCount} />;
}
