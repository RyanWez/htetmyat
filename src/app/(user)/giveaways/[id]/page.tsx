import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import GiveawayDetailClient from './giveaway-detail-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: giveaway } = await supabase.from('giveaways').select('*').eq('id', id).single();
  
  if (!giveaway) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `${giveaway.title} — Premium Giveaway`,
    description: giveaway.description || 'Access premium giveaways on HMA.',
  };
}

export default async function GiveawayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const supabase = await createClient();
  
  const { data: giveaway } = await supabase.from('giveaways').select('*').eq('id', id).single();
  
  if (!giveaway) {
    notFound();
  }

  let secret = null;
  if (session?.user) {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceClient = await createServiceClient();
    const { data: secretData } = await serviceClient
      .from('giveaway_secrets')
      .select('giveaway_id, qr_code_url, credentials')
      .eq('giveaway_id', id)
      .single();
    
    if (secretData) {
      secret = secretData;
    }
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('giveaway_comments')
    .select(`
      id,
      giveaway_id,
      user_id,
      comment_text,
      created_at,
      parent_id,
      profiles:user_id ( id, display_name, avatar_url, role )
    `)
    .eq('giveaway_id', id)
    .order('created_at', { ascending: false });

  // For nested comments, reshape if necessary, or just rely on client to build tree.
  const mappedComments = (comments || []).map(c => ({
    ...c,
    profile: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
  }));

  return (
    <GiveawayDetailClient 
      giveaway={giveaway} 
      secret={secret}
      initialComments={mappedComments}
      currentUser={session?.user || null} 
    />
  );
}
