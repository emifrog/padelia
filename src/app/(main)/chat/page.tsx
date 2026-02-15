import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import NewConversationButton from '@/components/chat/NewConversationButton';

export const metadata = { title: 'Messages' };

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch conversations with all members in a single query (avoids N+1)
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id,
      last_read_at,
      is_muted,
      conversations (
        id,
        type,
        name,
        last_message_at,
        last_message_preview,
        conversation_members (
          user_id,
          profiles ( full_name, username )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('conversation_id', { ascending: false });

  // Build conversation list — no extra queries needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations = (memberships ?? []).map((m: any) => {
    const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
    if (!conv) return null;

    let displayName = conv.name;
    let avatarInitial = '?';
    const isGroup = conv.type === 'group';

    // For direct chats, find the other member's name from pre-loaded data
    if (conv.type === 'direct' && !conv.name) {
      const otherMember = (conv.conversation_members ?? []).find(
        (cm: { user_id: string }) => cm.user_id !== user.id,
      );
      if (otherMember) {
        const profile = Array.isArray(otherMember.profiles)
          ? otherMember.profiles[0]
          : otherMember.profiles;
        displayName = profile?.full_name ?? 'Joueur';
        avatarInitial = (profile?.full_name ?? '?').charAt(0).toUpperCase();
      }
    } else {
      avatarInitial = (displayName ?? '?').charAt(0).toUpperCase();
    }

    // Count unread
    const hasUnread = conv.last_message_at && m.last_read_at
      ? new Date(conv.last_message_at) > new Date(m.last_read_at)
      : false;

    return {
      id: conv.id,
      type: conv.type,
      isGroup,
      displayName: displayName ?? 'Conversation',
      avatarInitial,
      lastMessage: conv.last_message_preview,
      lastMessageAt: conv.last_message_at,
      hasUnread,
      isMuted: m.is_muted,
    };
  });

  const validConversations = conversations
    .filter(Boolean)
    .sort((a, b) => {
      if (!a!.lastMessageAt) return 1;
      if (!b!.lastMessageAt) return -1;
      return new Date(b!.lastMessageAt).getTime() - new Date(a!.lastMessageAt).getTime();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Messages</h1>
        <NewConversationButton />
      </div>

      {/* Search bar (mockup style) */}
      <div className="flex items-center gap-2.5 rounded-2xl bg-gray-50 px-4 py-2.5">
        <Search className="h-4 w-4 text-gray-400" />
        <span className="text-[14px] text-gray-400">Rechercher une conversation...</span>
      </div>

      {validConversations.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {validConversations.map((conv) => {
            if (!conv) return null;
            const timeStr = conv.lastMessageAt
              ? new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })
              : '';

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-3 py-3 transition-colors active:scale-[0.99]"
              >
                {/* Avatar with gradient bg and online dot */}
                <div className="relative shrink-0">
                  <div className={`flex h-[50px] w-[50px] items-center justify-center rounded-full text-[24px] ${
                    conv.isGroup
                      ? 'bg-gradient-to-br from-lime-padel/15 to-green-padel/15'
                      : 'bg-green-padel/10'
                  }`}>
                    {conv.avatarInitial}
                  </div>
                  {/* Online indicator for direct chats */}
                  {!conv.isGroup && (
                    <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-padel" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`truncate text-[15px] text-navy ${conv.hasUnread ? 'font-bold' : 'font-semibold'}`}>
                      {conv.displayName}
                    </span>
                    <span className={`shrink-0 text-[11px] ${conv.hasUnread ? 'font-medium text-green-padel' : 'text-gray-400'}`}>
                      {timeStr}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className={`mt-0.5 truncate text-[13px] ${conv.hasUnread ? 'font-medium text-gray-600' : 'text-gray-400'}`}>
                      {conv.lastMessage}
                    </p>
                  )}
                </div>

                {/* Unread badge (green circle with count) */}
                {conv.hasUnread && (
                  <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-green-padel text-[11px] font-bold text-white">
                    1
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Aucune conversation</p>
          <p className="text-sm text-muted-foreground">
            Commence une conversation avec un joueur
          </p>
        </div>
      )}
    </div>
  );
}
