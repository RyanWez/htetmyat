import { Metadata } from 'next';
import GiveawaysClient from './giveaways-client';

export const metadata: Metadata = {
  title: 'Giveaways — HMA',
  description: 'Access premium VPN keys, App store credentials, and more for free.',
};

import { auth } from '@/lib/auth';

export default async function GiveawaysPage() {
  const session = await auth();
  return <GiveawaysClient currentUser={session?.user} />;
}
