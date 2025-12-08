
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type Notification = Tables<'notifications'> & {
  sender: Tables<'users'> | null;
  stream: Tables<'streams'> | null;
};

export default function InboxScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(*)' + ', stream:ref_stream_id(*)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data as any);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      fetchNotifications();
      const cleanup = subscribeToNotifications();
      return cleanup;
    }
  }, [user, fetchNotifications, subscribeToNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
    }

    if (notification.type === 'stream_started' && notification.stream) {
      router.push({
        pathname: '/live-player',
        params: { streamId: notification.stream.id },
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stream_started':
        return { ios: 'video.fill', android: 'videocam' };
      case 'follow':
        return { ios: 'person.fill.badge.plus', android: 'person_add' };
      case 'mention':
        return { ios: 'at', android: 'alternate_email' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'stream_started':
        return `${notification.sender?.display_name || 'Someone'} started a live stream`;
      case 'follow':
        return `${notification.sender?.display_name || 'Someone'} started following you`;
      case 'mention':
        return `${notification.sender?.display_name || 'Someone'} mentioned you in chat`;
      default:
        return notification.message || 'New notification';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bell.slash"
              android_material_icon_name="notifications_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You&apos;ll be notified when someone follows you or goes live
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIcon}>
                  <IconSymbol
                    ios_icon_name={icon.ios}
                    android_material_icon_name={icon.android}
                    size={24}
                    color={notification.read ? colors.textSecondary : colors.gradientEnd}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationText}>{getNotificationText(notification)}</Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.created_at || '')}
                  </Text>
                </View>

                {notification.sender?.avatar && (
                  <Image
                    source={{ uri: notification.sender.avatar }}
                    style={styles.notificationAvatar}
                  />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  notificationUnread: {
    backgroundColor: colors.backgroundAlt,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
});
