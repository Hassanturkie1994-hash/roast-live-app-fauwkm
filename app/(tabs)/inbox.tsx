
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'live';
  user: {
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'live',
    user: {
      name: 'GamerPro',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    },
    message: 'started a live stream',
    timestamp: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'follow',
    user: {
      name: 'ChefMaster',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    message: 'started following you',
    timestamp: '15m ago',
    read: false,
  },
  {
    id: '3',
    type: 'like',
    user: {
      name: 'BeatMaker',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    message: 'liked your stream',
    timestamp: '1h ago',
    read: true,
  },
  {
    id: '4',
    type: 'comment',
    user: {
      name: 'ArtistPro',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    },
    message: 'commented on your stream',
    timestamp: '2h ago',
    read: true,
  },
  {
    id: '5',
    type: 'live',
    user: {
      name: 'FitCoach',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
    message: 'started a live stream',
    timestamp: '3h ago',
    read: true,
  },
];

export default function InboxScreen() {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'live':
        return { ios: 'video.fill', android: 'videocam' };
      case 'follow':
        return { ios: 'person.badge.plus.fill', android: 'person_add' };
      case 'like':
        return { ios: 'heart.fill', android: 'favorite' };
      case 'comment':
        return { ios: 'bubble.left.fill', android: 'chat_bubble' };
      default:
        return { ios: 'bell.fill', android: 'notifications' };
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity>
          <IconSymbol
            ios_icon_name="ellipsis.circle"
            android_material_icon_name="more_horiz"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {mockNotifications.map((notification, index) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: notification.user.avatar }}
                  style={styles.notificationAvatar}
                />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationText}>
                    <Text style={styles.notificationUsername}>
                      {notification.user.name}
                    </Text>{' '}
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTimestamp}>
                    {notification.timestamp}
                  </Text>
                </View>
                <View style={styles.notificationIconContainer}>
                  <IconSymbol
                    ios_icon_name={icon.ios}
                    android_material_icon_name={icon.android}
                    size={20}
                    color={notification.type === 'live' ? colors.gradientEnd : colors.textSecondary}
                  />
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Total Views</Text>
                <Text style={styles.activityValue}>125.4K</Text>
              </View>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Total Likes</Text>
                <Text style={styles.activityValue}>45.2K</Text>
              </View>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={24}
                color={colors.gradientEnd}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>New Followers</Text>
                <Text style={styles.activityValue}>+342</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  notificationCardUnread: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.gradientEnd + '40',
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
  notificationUsername: {
    fontWeight: '700',
  },
  notificationTimestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
});
