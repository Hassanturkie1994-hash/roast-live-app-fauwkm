
import { supabase } from '@/app/integrations/supabase/client';
import { inboxService } from './inboxService';

// Extended notification types for push notifications
export type PushNotificationType =
  | 'SYSTEM_WARNING'
  | 'MODERATION_WARNING'
  | 'TIMEOUT_APPLIED'
  | 'BAN_APPLIED'
  | 'BAN_EXPIRED'
  | 'APPEAL_RECEIVED'
  | 'APPEAL_APPROVED'
  | 'APPEAL_DENIED'
  | 'ADMIN_ANNOUNCEMENT'
  | 'SAFETY_REMINDER'
  | 'stream_started'
  | 'moderator_role_updated'
  | 'gift_received'
  | 'new_follower'
  | 'new_message';

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface PushDeviceToken {
  id: string;
  user_id: string;
  platform: DevicePlatform;
  device_token: string;
  created_at: string;
  last_used_at: string;
  is_active: boolean;
}

export interface PushNotificationLog {
  id: string;
  user_id: string;
  type: PushNotificationType;
  title: string;
  body: string;
  payload_json?: Record<string, any>;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'failed';
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
   * PROMPT 1: Register or update device token
   * On app login: register or update token, mark previous tokens for same device as inactive if needed
   */
  async registerDeviceToken(
    userId: string,
    deviceToken: string,
    platform: DevicePlatform
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mark all existing tokens for this user and device as inactive
      await supabase
        .from('push_device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', deviceToken);

      // Insert or update the new token
      const { error } = await supabase
        .from('push_device_tokens')
        .upsert({
          user_id: userId,
          device_token: deviceToken,
          platform,
          last_used_at: new Date().toISOString(),
          is_active: true,
        }, {
          onConflict: 'user_id,device_token',
        });

      if (error) {
        console.error('Error registering device token:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Device token registered for user ${userId} on ${platform}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in registerDeviceToken:', error);
      return { success: false, error: error.message || 'Failed to register device token' };
    }
  }

  /**
   * Get active device tokens for a user
   */
  async getActiveDeviceTokens(userId: string): Promise<PushDeviceToken[]> {
    try {
      const { data, error } = await supabase
        .from('push_device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching device tokens:', error);
        return [];
      }

      return data as PushDeviceToken[];
    } catch (error) {
      console.error('Error in getActiveDeviceTokens:', error);
      return [];
    }
  }

  /**
   * Deactivate a specific device token
   */
  async deactivateDeviceToken(
    userId: string,
    deviceToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('push_device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', deviceToken);

      if (error) {
        console.error('Error deactivating device token:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Device token deactivated for user ${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error in deactivateDeviceToken:', error);
      return { success: false, error: error.message || 'Failed to deactivate device token' };
    }
  }

  /**
   * PROMPT 1: Core push notification sender
   * Wrap this behind a single backend function: sendPushNotification(userId, type, title, body, payload)
   * 
   * This function:
   * 1. Logs the notification in push_notifications_log
   * 2. Creates an in-app notification in the notifications table
   * 3. Sends the actual push notification via FCM/APNs (via edge function)
   */
  async sendPushNotification(
    userId: string,
    type: PushNotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get active device tokens
      const tokens = await this.getActiveDeviceTokens(userId);

      if (tokens.length === 0) {
        console.log(`No active device tokens for user ${userId}`);
        // Still log the notification even if no tokens
      }

      // Log the push notification
      const { data: logEntry, error: logError } = await supabase
        .from('push_notifications_log')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          payload_json: payload || null,
          delivery_status: tokens.length > 0 ? 'pending' : 'failed',
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging push notification:', logError);
        return { success: false, error: logError.message };
      }

      // Create in-app notification
      await this.createInAppNotification(userId, type, title, body, payload);

      // Send actual push notification via edge function (if tokens exist)
      if (tokens.length > 0) {
        try {
          const { data, error: edgeError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId,
              tokens: tokens.map(t => ({ token: t.device_token, platform: t.platform })),
              notification: {
                title,
                body,
                data: payload || {},
              },
            },
          });

          if (edgeError) {
            console.error('Error sending push notification via edge function:', edgeError);
            // Update log entry to failed
            await supabase
              .from('push_notifications_log')
              .update({ delivery_status: 'failed' })
              .eq('id', logEntry.id);
            
            return { success: false, error: edgeError.message };
          }

          // Update log entry to sent
          await supabase
            .from('push_notifications_log')
            .update({ delivery_status: 'sent' })
            .eq('id', logEntry.id);

          console.log(`📲 Push notification sent to ${tokens.length} devices for user ${userId}`);
        } catch (edgeError: any) {
          console.error('Error invoking edge function:', edgeError);
          // Update log entry to failed
          await supabase
            .from('push_notifications_log')
            .update({ delivery_status: 'failed' })
            .eq('id', logEntry.id);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendPushNotification:', error);
      return { success: false, error: error.message || 'Failed to send push notification' };
    }
  }

  /**
   * Create in-app notification (mirrors push notification)
   */
  private async createInAppNotification(
    userId: string,
    type: PushNotificationType,
    title: string,
    body: string,
    payload?: Record<string, any>
  ): Promise<void> {
    try {
      // Map push notification types to in-app notification types and categories
      let notificationType: string = 'system_update';
      let category: 'social' | 'gifts' | 'safety' | 'wallet' | 'admin' = 'admin';

      switch (type) {
        case 'MODERATION_WARNING':
        case 'TIMEOUT_APPLIED':
        case 'BAN_APPLIED':
        case 'BAN_EXPIRED':
        case 'SAFETY_REMINDER':
          notificationType = 'warning';
          category = 'safety';
          break;
        case 'APPEAL_RECEIVED':
        case 'APPEAL_APPROVED':
        case 'APPEAL_DENIED':
          notificationType = 'system_update';
          category = 'safety';
          break;
        case 'ADMIN_ANNOUNCEMENT':
        case 'SYSTEM_WARNING':
          notificationType = 'admin_announcement';
          category = 'admin';
          break;
        case 'stream_started':
          notificationType = 'stream_started';
          category = 'social';
          break;
        case 'gift_received':
          notificationType = 'gift_received';
          category = 'gifts';
          break;
        case 'new_follower':
          notificationType = 'follow';
          category = 'social';
          break;
        case 'new_message':
          notificationType = 'message';
          category = 'social';
          break;
      }

      await supabase.from('notifications').insert({
        type: notificationType,
        sender_id: payload?.sender_id || null,
        receiver_id: userId,
        message: `${title}\n\n${body}`,
        ref_stream_id: payload?.stream_id || null,
        ref_post_id: payload?.post_id || null,
        ref_story_id: payload?.story_id || null,
        category,
        read: false,
      });

      console.log(`✅ In-app notification created for user ${userId}`);
    } catch (error) {
      console.error('Error creating in-app notification:', error);
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
    } catch (error: any) {
      console.error('Error in updatePreferences:', error);
      return { success: false, error: error.message || 'Failed to update preferences' };
    }
  }

  /**
   * Get push notification logs for a user
   */
  async getPushNotificationLogs(
    userId: string,
    limit: number = 50
  ): Promise<PushNotificationLog[]> {
    try {
      const { data, error } = await supabase
        .from('push_notifications_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching push notification logs:', error);
        return [];
      }

      return data as PushNotificationLog[];
    } catch (error) {
      console.error('Error in getPushNotificationLogs:', error);
      return [];
    }
  }

  /**
   * Get all push notification logs (admin only)
   */
  async getAllPushNotificationLogs(
    filters?: {
      type?: PushNotificationType;
      deliveryStatus?: 'pending' | 'sent' | 'failed';
      limit?: number;
    }
  ): Promise<PushNotificationLog[]> {
    try {
      let query = supabase
        .from('push_notifications_log')
        .select('*')
        .order('sent_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.deliveryStatus) {
        query = query.eq('delivery_status', filters.deliveryStatus);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all push notification logs:', error);
        return [];
      }

      return data as PushNotificationLog[];
    } catch (error) {
      console.error('Error in getAllPushNotificationLogs:', error);
      return [];
    }
  }
}

export const pushNotificationService = new PushNotificationService();
