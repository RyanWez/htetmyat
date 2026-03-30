'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addComment(formData: FormData) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) {
    throw new Error('You must be logged in to comment.');
  }

  const supabase = await createServiceClient();
  
  const apple_id = formData.get('apple_id') as string;
  const comment_text = formData.get('comment_text') as string;
  const parent_id = formData.get('parent_id') as string || null;

  if (!apple_id || !comment_text) {
    throw new Error('Missing fields');
  }

  const { error } = await supabase
    .from('apple_id_comments')
    .insert([
      { apple_id, comment_text, parent_id, user_id: user.id }
    ]);

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Comment ထည့်သွင်းခြင်း မအောင်မြင်ပါ။');
  }

  revalidatePath(`/apple-ids/${apple_id}`);
}

export async function deleteComment(commentId: string, appleId: string) {
  const session = await auth();
  const user = session?.user;
  
  if (!user || user.role !== 'admin') {
    throw new Error('Only admins can delete comments.');
  }

  const supabase = await createServiceClient();

  // Fetch the comment to check who owns it
  const { data: comment, error: fetchError } = await supabase
    .from('apple_id_comments')
    .select('*, profiles(role)')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    throw new Error('Comment not found.');
  }

  // Logic: 
  // 1. If target is a User comment -> Any Admin can delete.
  // 2. If target is an Admin comment -> Only the author Admin can delete.
  const targetIsAdmin = comment.profiles?.role === 'admin';
  if (targetIsAdmin && comment.user_id !== user.id) {
    throw new Error('You can only delete your own admin comments.');
  }

  const { error: deleteError } = await supabase
    .from('apple_id_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    throw new Error('Failed to delete comment.');
  }

  revalidatePath(`/apple-ids/${appleId}`);
}

export async function getAppleIdData(id: string) {
  const supabase = await createServiceClient();
  
  const [appleResponse, commentsResponse] = await Promise.all([
    supabase
      .from('apple_ids')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('apple_id_comments')
      .select('*, profiles(display_name, avatar_url, role)')
      .eq('apple_id', id)
      .order('created_at', { ascending: true })
  ]);

  if (appleResponse.error) throw new Error(appleResponse.error.message);
  if (commentsResponse.error) throw new Error(commentsResponse.error.message);

  return {
    appleId: appleResponse.data,
    comments: commentsResponse.data
  };
}
