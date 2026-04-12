import { Metadata } from 'next';
import HomeClient from './home-client';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: 'HMA — Premium Free Apple IDs',
  description: 'Gain instant access to our managed, updated, and highly secure Apple IDs. Download your favorite iOS apps securely, without boundaries.',
  keywords: ['apple ids', 'free apple id', 'ios', 'app store account'],
};

// 60 sec ISR caching without cookies forcing dynamic render
const getCachedCount = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { count } = await supabase
      .from('apple_ids')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  },
  ['home-apple-ids-count'],
  { revalidate: 60 }
);

export default async function HomePage() {
  const totalCount = await getCachedCount();
  return <HomeClient totalCount={totalCount} />;
}
