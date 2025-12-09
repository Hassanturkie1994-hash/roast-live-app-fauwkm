
import { supabase } from '@/app/integrations/supabase/client';

export interface Moderator {
  id: string;
  streamer_id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface BannedUser {
  id: string;
  streamer_id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface TimedOutUser {
  id: string;
  stream_id: string;
  user_id: string;
  end_time: string;
  created_at: string;
}

export interface PinnedComment {
  id: string;
  stream_id: string;
  message_id: string;
  pinned_by: string;
  expires_at: string;
  created_at: string;
  chat_messages?: {
    id: string;
    message: string;
    user_id: string;
    users: {
      display_name: string;
      username: string;
    };
  };
}

class ModerationService {
  // Check if user is a moderator for a streamer
  async isModerator(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking moderator status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isModerator:', error);
      return false;
    }
  }

  // Check if user is banned by a streamer
  async isBanned(streamerId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking ban status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isBanned:', error);
      return false;
    }
  }

  // Check if user is timed out in a stream
  async isTimedOut(streamId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('timed_out_users')
        .select('end_time')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking timeout status:', error);
        return false;
      }

      if (!data) return false;

      // Check if timeout has expired
      const endTime = new Date(data.end_time);
      const now = new Date();
      return now < endTime;
    } catch (error) {
      console.error('Error in isTimedOut:', error);
      return false;
    }
  }

  // Add a moderator
  async addModerator(streamerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('moderators')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
        });

      if (error) {
        console.error('Error adding moderator:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Moderator added successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in addModerator:', error);
      return { success: false, error: 'Failed to add moderator' };
    }
  }

  // Remove a moderator
  async removeModerator(streamerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('moderators')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing moderator:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Moderator removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeModerator:', error);
      return { success: false, error: 'Failed to remove moderator' };
    }
  }

  // Get all moderators for a streamer
  async getModerators(streamerId: string): Promise<Moderator[]> {
    try {
      const { data, error } = await supabase
        .from('moderators')
        .select('*, profiles(*)')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching moderators:', error);
        return [];
      }

      return data as Moderator[];
    } catch (error) {
      console.error('Error in getModerators:', error);
      return [];
    }
  }

  // Ban a user
  async banUser(streamerId: string, userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('banned_users')
        .insert({
          streamer_id: streamerId,
          user_id: userId,
          reason: reason || null,
        });

      if (error) {
        console.error('Error banning user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User banned successfully');
      
      // Broadcast ban event to remove user from stream
      await supabase.channel(`streamer:${streamerId}:moderation`).send({
        type: 'broadcast',
        event: 'user_banned',
        payload: { user_id: userId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in banUser:', error);
      return { success: false, error: 'Failed to ban user' };
    }
  }

  // Unban a user
  async unbanUser(streamerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unbanning user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User unbanned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unbanUser:', error);
      return { success: false, error: 'Failed to unban user' };
    }
  }

  // Get all banned users for a streamer
  async getBannedUsers(streamerId: string): Promise<BannedUser[]> {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*, profiles(*)')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banned users:', error);
        return [];
      }

      return data as BannedUser[];
    } catch (error) {
      console.error('Error in getBannedUsers:', error);
      return [];
    }
  }

  // Timeout a user
  async timeoutUser(streamId: string, userId: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (durationMinutes < 1 || durationMinutes > 60) {
        return { success: false, error: 'Timeout duration must be between 1 and 60 minutes' };
      }

      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      // Delete existing timeout if any
      await supabase
        .from('timed_out_users')
        .delete()
        .eq('stream_id', streamId)
        .eq('user_id', userId);

      // Insert new timeout
      const { error } = await supabase
        .from('timed_out_users')
        .insert({
          stream_id: streamId,
          user_id: userId,
          end_time: endTime.toISOString(),
        });

      if (error) {
        console.error('Error timing out user:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ User timed out for ${durationMinutes} minutes`);
      
      // Broadcast timeout event
      await supabase.channel(`stream:${streamId}:moderation`).send({
        type: 'broadcast',
        event: 'user_timed_out',
        payload: { user_id: userId, duration_minutes: durationMinutes },
      });

      return { success: true };
    } catch (error) {
      console.error('Error in timeoutUser:', error);
      return { success: false, error: 'Failed to timeout user' };
    }
  }

  // Remove a comment
  async removeComment(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error removing comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment removed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in removeComment:', error);
      return { success: false, error: 'Failed to remove comment' };
    }
  }

  // Pin a comment
  async pinComment(streamId: string, messageId: string, pinnedBy: string, durationMinutes: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (durationMinutes < 1 || durationMinutes > 5) {
        return { success: false, error: 'Pin duration must be between 1 and 5 minutes' };
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      // Remove existing pinned comment if any
      await supabase
        .from('pinned_comments')
        .delete()
        .eq('stream_id', streamId);

      // Insert new pinned comment
      const { error } = await supabase
        .from('pinned_comments')
        .insert({
          stream_id: streamId,
          message_id: messageId,
          pinned_by: pinnedBy,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Error pinning comment:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Comment pinned for ${durationMinutes} minutes`);
      return { success: true };
    } catch (error) {
      console.error('Error in pinComment:', error);
      return { success: false, error: 'Failed to pin comment' };
    }
  }

  // Unpin a comment
  async unpinComment(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pinned_comments')
        .delete()
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error unpinning comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment unpinned successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unpinComment:', error);
      return { success: false, error: 'Failed to unpin comment' };
    }
  }

  // Get pinned comment for a stream
  async getPinnedComment(streamId: string): Promise<PinnedComment | null> {
    try {
      const { data, error } = await supabase
        .from('pinned_comments')
        .select('*, chat_messages(*, users(display_name, username))')
        .eq('stream_id', streamId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching pinned comment:', error);
        return null;
      }

      if (!data) return null;

      // Check if pin has expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Auto-remove expired pin
        await this.unpinComment(streamId);
        return null;
      }

      return data as PinnedComment;
    } catch (error) {
      console.error('Error in getPinnedComment:', error);
      return null;
    }
  }

  // Like a comment
  async likeComment(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          message_id: messageId,
          user_id: userId,
        });

      if (error) {
        console.error('Error liking comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment liked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in likeComment:', error);
      return { success: false, error: 'Failed to like comment' };
    }
  }

  // Unlike a comment
  async unlikeComment(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment unliked successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in unlikeComment:', error);
      return { success: false, error: 'Failed to unlike comment' };
    }
  }

  // Get comment likes count
  async getCommentLikesCount(messageId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);

      if (error) {
        console.error('Error fetching comment likes count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCommentLikesCount:', error);
      return 0;
    }
  }

  // Search users by username for adding moderators
  async searchUsersByUsername(username: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${username}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsersByUsername:', error);
      return [];
    }
  }
}

export const moderationService = new ModerationService();
