
import { supabase } from '@/app/integrations/supabase/client';

export type NotificationType = 
  | 'stream_started'
  | 'moderator_role_updated'
  | 'gift_received'
  | 'new_follower'
  | 'new_message';

export interface PushNotificationToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  created_at: string;
  last_used_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  stream_started: boolean;
  moderator_role_updated: boolean;
  gift_received: boolean;
  new_follower: boolean;
  new_message: boolean;
  created_at: string;
  updated_at: string;
}

class PushNotificationService {
  /**
   * Register a push notification token
   */
  async registerToken(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android' | 'web'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: userId,
          token,
          device_type: deviceType,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('Error registering push token:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Push token registered successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in registerToken:', error);
      return { success: false, error: 'Failed to register token' };
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            stream_started: true,
            moderator_role_updated: true,
            gift_received: true,
            new_follower: true,
            new_message: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating notification preferences:', insertError);
          return null;
        }

        return newData as NotificationPreferences;
      }

      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error in getPreferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Notification preferences updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  /**
   * Send a notification (this would typically call an edge function)
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has this notification type enabled
      const preferences = await this.getPreferences(userId);
      if (!preferences || !preferences[type]) {
        console.log(`Notification type ${type} is disabled for user ${userId}`);
        return { success: true }; // Not an error, just disabled
      }

      // Get user's push tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('push_notification_tokens')
        .select('*')
        .eq('user_id', userId);

      if (tokensError || !tokens || tokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return { success: true }; // Not an error, just no tokens
      }

      // In a real implementation, you would call an edge function here
      // that sends the actual push notification via FCM/APNS
      console.log(`📲 Would send notification to ${tokens.length} devices:`, {
        type,
        title,
        body,
        data,
      });

      // Create a notification record in the database
      await supabase.from('notifications').insert({
        type,
        sender_id: data?.sender_id || null,
        receiver_id: userId,
        message: body,
        ref_stream_id: data?.stream_id || null,
        ref_post_id: data?.post_id || null,
        ref_story_id: data?.story_id || null,
      });

      return { success: true };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }
}

export const pushNotificationService = new PushNotificationService();
