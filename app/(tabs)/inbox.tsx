
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { messagingService, Conversation } from '@/app/services/messagingService';

export default function InboxScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const result = await messagingService.getConversations(user.id);
      
      if (result.success && result.conversations) {
        setConversations(result.conversations);
        
        const unreadTotal = result.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setTotalUnread(unreadTotal);
      }
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      fetchConversations();
      
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    if (!conversation.other_user) return;

    router.push({
      pathname: '/screens/ChatScreen',
      params: {
        conversationId: conversation.id,
        otherUserId: conversation.other_user.id,
        otherUsername: conversation.other_user.display_name || conversation.other_user.username,
        otherAvatar: conversation.other_user.avatar_url || '',
      },
    });
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.brandPrimary }]}>
              <Text style={styles.unreadText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.brandPrimary} 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bubble.left.and.bubble.right"
              android_material_icon_name="chat"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start a conversation from someone&apos;s profile or during a live stream
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => {
            if (!conversation.other_user) return null;

            const hasUnread = (conversation.unread_count || 0) > 0;

            return (
              <TouchableOpacity
                key={conversation.id}
                style={[
                  styles.conversationCard,
                  { 
                    backgroundColor: hasUnread ? colors.backgroundAlt : colors.background,
                    borderBottomColor: colors.border 
                  },
                ]}
                onPress={() => handleConversationPress(conversation)}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: conversation.other_user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                  }}
                  style={[styles.avatar, { backgroundColor: colors.card }]}
                />

                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                      {conversation.other_user.display_name || conversation.other_user.username}
                    </Text>
                    {conversation.last_message && (
                      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                        {formatTime(conversation.last_message.created_at)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.conversationFooter}>
                    {conversation.last_message ? (
                      <Text
                        style={[
                          styles.lastMessage,
                          { color: hasUnread ? colors.text : colors.textSecondary },
                          hasUnread && styles.lastMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                        {conversation.last_message.content}
                      </Text>
                    ) : (
                      <Text style={[styles.lastMessage, { color: colors.textSecondary }]}>
                        No messages yet
                      </Text>
                    )}

                    {hasUnread && (
                      <View style={[styles.unreadCountBadge, { backgroundColor: colors.brandPrimary }]}>
                        <Text style={styles.unreadCountText}>
                          {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  unreadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationContent: {
    flex: 1,
    gap: 6,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
  },
  unreadCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
