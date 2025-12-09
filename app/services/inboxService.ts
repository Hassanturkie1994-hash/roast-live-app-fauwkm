
import { supabase } from '@/app/integrations/supabase/client';

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update all unread messages in the conversation
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markConversationAsRead:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    // Get all conversations where user is participant
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return 0;
    }

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages in these conversations
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadMessageCount:', error);
    return 0;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export const inboxService = {
  markConversationAsRead,
  getUnreadMessageCount,
  markAllNotificationsAsRead,
};
