
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
import { notificationService } from '@/app/services/notificationService';

type Notification = Tables<'notifications'> & {
  sender: Tables<'users'> | null;
  stream: Tables<'streams'> | null;
};

export default function InboxScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(*), stream:ref_stream_id(*)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data as any);

      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
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
      await notificationService.markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.type === 'stream_started' && notification.stream) {
      router.push({
        pathname: '/live-player',
        params: { streamId: notification.stream.id },
      });
    } else if (notification.type === 'like' && notification.ref_post_id) {
      router.push(`/screens/PostDetailScreen?postId=${notification.ref_post_id}`);
    } else if (notification.type === 'comment' && notification.ref_post_id) {
      router.push(`/screens/PostDetailScreen?postId=${notification.ref_post_id}`);
    } else if (notification.type === 'follow' && notification.sender) {
      router.push(`/screens/UserProfileScreen?userId=${notification.sender.id}`);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setUnreadCount(0);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stream_started':
        return { ios: 'video.fill', android: 'videocam' };
      case 'follow':
        return { ios: 'person.fill.badge.plus', android: 'person_add' };
      case 'like':
        return { ios: 'heart.fill', android: 'favorite' };
      case 'comment':
        return { ios: 'bubble.left.fill', android: 'comment' };
      case 'message':
        return { ios: 'envelope.fill', android: 'mail' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  };

  const getNotificationText = (notification: Notification) => {
    const senderName = notification.sender?.display_name || 'Someone';
    switch (notification.type) {
      case 'stream_started':
        return `${senderName} started a live stream`;
      case 'follow':
        return `${senderName} started following you`;
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'message':
        return `${senderName} sent you a message`;
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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        showsVerticalScrollIndicator={false}
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
              You&apos;ll be notified when someone follows you, likes your posts, or goes live
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
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
                  <Text style={styles.notificationTime}>{formatTime(notification.created_at || '')}</Text>
                </View>

                {notification.sender?.avatar && (
                  <Image source={{ uri: notification.sender.avatar }} style={styles.notificationAvatar} />
                )}

                {!notification.read && <View style={styles.unreadDot} />}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
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
    position: 'relative',
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
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
});
