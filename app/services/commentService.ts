
import { supabase } from '@/app/integrations/supabase/client';

export interface LiveComment {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

class CommentService {
  // Save a comment to the database
  async saveComment(
    streamId: string,
    userId: string,
    message: string
  ): Promise<{ success: boolean; data?: LiveComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('live_comments')
        .insert({
          stream_id: streamId,
          user_id: userId,
          message,
        })
        .select('*, profiles(*)')
        .single();

      if (error) {
        console.error('Error saving comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment saved successfully');
      return { success: true, data: data as LiveComment };
    } catch (error) {
      console.error('Error in saveComment:', error);
      return { success: false, error: 'Failed to save comment' };
    }
  }

  // Get comments for a stream
  async getComments(streamId: string, limit: number = 50): Promise<LiveComment[]> {
    try {
      const { data, error } = await supabase
        .from('live_comments')
        .select('*, profiles(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return (data as LiveComment[]).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error in getComments:', error);
      return [];
    }
  }

  // Delete a comment
  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('live_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Comment deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return { success: false, error: 'Failed to delete comment' };
    }
  }

  // Get comment count for a stream
  async getCommentCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('live_comments')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error fetching comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCommentCount:', error);
      return 0;
    }
  }
}

export const commentService = new CommentService();
