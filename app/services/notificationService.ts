
import { supabase } from '@/app/integrations/supabase/client';

export const notificationService = {
  async createNotification(
    senderId: string,
    receiverId: string,
    type: 'like' | 'comment' | 'follow' | 'message' | 'stream_started',
    message?: string,
    refPostId?: string,
    refStoryId?: string,
    refStreamId?: string
  ) {
    try {
      const { error } = await supabase.from('notifications').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        type,
        message,
        ref_post_id: refPostId,
        ref_story_id: refStoryId,
        ref_stream_id: refStreamId,
        read: false,
      });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error };
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return { success: false, count: 0, error };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return { success: false, count: 0, error };
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error };
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return { success: false, error };
    }
  },
};
