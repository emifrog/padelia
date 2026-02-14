import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ChatWindow from '@/components/chat/ChatWindow';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from('conversations')
    .select('name')
    .eq('id', id)
    .single();
  return { title: conv?.name ?? 'Conversation' };
}

export default async function ConversationPage({ params }: PageProps) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify user is a member
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  // Get conversation info
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, type, name')
    .eq('id', conversationId)
    .single();

  if (!conv) notFound();

  // For direct chats, get the other person's name
  let displayName = conv.name ?? 'Conversation';
  if (conv.type === 'direct' && !conv.name) {
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select('user_id, profiles (full_name)')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .limit(1);

    if (otherMembers && otherMembers.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = Array.isArray((otherMembers[0] as any).profiles)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (otherMembers[0] as any).profiles[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : (otherMembers[0] as any).profiles;
      displayName = profile?.full_name ?? 'Joueur';
    }
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      userId={user.id}
      displayName={displayName}
      conversationType={conv.type}
    />
  );
}
