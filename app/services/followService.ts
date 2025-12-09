
import { supabase } from '@/app/integrations/supabase/client';

export const followService = {
  async followUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase.from('followers').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) {
        console.error('Error following user:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in followUser:', error);
      return { success: false, error };
    }
  },

  async unfollowUser(followerId: string, followingId: string) {
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      return { success: false, error };
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFollowing:', error);
      return false;
    }
  },

  async getFollowers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id, profiles!followers_follower_id_fkey(*)')
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching followers:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getFollowers:', error);
      return { success: false, data: [], error };
    }
  },

  async getFollowing(userId: string) {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id, profiles!followers_following_id_fkey(*)')
        .eq('follower_id', userId);

      if (error) {
        console.error('Error fetching following:', error);
        return { success: false, data: [], error };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getFollowing:', error);
      return { success: false, data: [], error };
    }
  },
};
