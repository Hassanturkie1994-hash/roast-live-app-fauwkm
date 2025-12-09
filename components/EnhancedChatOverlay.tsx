
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { IconSymbol } from '@/components/IconSymbol';
import { moderationService } from '@/app/services/moderationService';
import { fanClubService } from '@/app/services/fanClubService';
import { userBlockingService } from '@/app/services/userBlockingService';
import UserActionModal from '@/components/UserActionModal';

type ChatMessage = Tables<'chat_messages'> & {
  users: Tables<'users'>;
  likes?: number;
  isLiked?: boolean;
};

type GiftMessage = {
  id: string;
  type: 'gift';
  sender_username: string;
  gift_name: string;
  amount: number;
  timestamp: number;
};

type Message = (ChatMessage & { type: 'chat' }) | GiftMessage;

interface EnhancedChatOverlayProps {
  streamId: string;
  streamerId: string;
  currentUserId: string;
  isStreamer: boolean;
  isModerator: boolean;
}

export default function EnhancedChatOverlay({
  streamId,
  streamerId,
  currentUserId,
  isStreamer,
  isModerator,
}: EnhancedChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedComment, setPinnedComment] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showUserActionModal, setShowUserActionModal] = useState(false);
  const [showCommentActions, setShowCommentActions] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [fanClubBadges, setFanClubBadges] = useState<Map<string, { color: string; name: string }>>(new Map());
  const [moderatorIds, setModeratorIds] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const chatChannelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);
  const moderationChannelRef = useRef<any>(null);

  const fetchRecentMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) {
        console.error('Error fetching chat messages:', error);
        return;
      }

      const chatMessages: Message[] = (data as ChatMessage[]).map((msg) => ({
        ...msg,
        type: 'chat' as const,
      }));

      setMessages(chatMessages);
    } catch (error) {
      console.error('Error in fetchRecentMessages:', error);
    }
  }, [streamId]);

  const fetchPinnedComment = useCallback(async () => {
    const pinned = await moderationService.getPinnedComment(streamId);
    setPinnedComment(pinned);
  }, [streamId]);

  const fetchBlockedUsers = useCallback(async () => {
    const blocked = await userBlockingService.getBlockedUsers(currentUserId);
    const blockedIds = new Set(blocked.map((b) => b.blocked_id));
    setBlockedUserIds(blockedIds);
  }, [currentUserId]);

  const fetchFanClubBadges = useCallback(async () => {
    // Get fan club info
    const fanClub = await fanClubService.getFanClub(streamerId);
    if (!fanClub) return;

    // Get all members
    const members = await fanClubService.getFanClubMembers(fanClub.id);
    const badgeMap = new Map();
    members.forEach((member) => {
      badgeMap.set(member.user_id, {
        color: fanClub.badge_color,
        name: fanClub.club_name,
      });
    });
    setFanClubBadges(badgeMap);
  }, [streamerId]);

  const fetchModerators = useCallback(async () => {
    const mods = await moderationService.getModerators(streamerId);
    const modIds = new Set(mods.map((m) => m.user_id));
    setModeratorIds(modIds);
  }, [streamerId]);

  const subscribeToChat = useCallback(() => {
    const chatChannel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'message' }, (payload) => {
        console.log('💬 New chat message received:', payload);
        const newMessage: Message = {
          ...payload.payload,
          type: 'chat' as const,
        };
        
        // Don't show messages from blocked users
        if (blockedUserIds.has(newMessage.user_id)) {
          return;
        }
        
        setMessages((prev) => [...prev, newMessage]);
      })
      .subscribe();

    chatChannelRef.current = chatChannel;
  }, [streamId, blockedUserIds]);

  const subscribeToGifts = useCallback(() => {
    const giftChannel = supabase
      .channel(`stream:${streamId}:gifts`)
      .on('broadcast', { event: 'gift_sent' }, (payload) => {
        console.log('🎁 Gift notification received:', payload);
        const giftData = payload.payload;
        const giftMessage: GiftMessage = {
          id: `gift-${Date.now()}-${Math.random()}`,
          type: 'gift',
          sender_username: giftData.sender_username,
          gift_name: giftData.gift_name,
          amount: giftData.amount,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, giftMessage]);
      })
      .subscribe();

    giftChannelRef.current = giftChannel;
  }, [streamId]);

  const subscribeToModeration = useCallback(() => {
    const moderationChannel = supabase
      .channel(`stream:${streamId}:moderation`)
      .on('broadcast', { event: 'comment_removed' }, (payload) => {
        console.log('🗑️ Comment removed:', payload);
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.payload.message_id));
      })
      .on('broadcast', { event: 'comment_pinned' }, () => {
        console.log('📌 Comment pinned');
        fetchPinnedComment();
      })
      .on('broadcast', { event: 'comment_unpinned' }, () => {
        console.log('📌 Comment unpinned');
        setPinnedComment(null);
      })
      .on('broadcast', { event: 'user_banned' }, (payload) => {
        console.log('🚫 User banned:', payload);
        // Remove all messages from banned user
        setMessages((prev) => prev.filter((msg) => {
          if (msg.type === 'chat') {
            return msg.user_id !== payload.payload.user_id;
          }
          return true;
        }));
      })
      .subscribe();

    moderationChannelRef.current = moderationChannel;
  }, [streamId, fetchPinnedComment]);

  useEffect(() => {
    fetchRecentMessages();
    fetchPinnedComment();
    fetchBlockedUsers();
    fetchFanClubBadges();
    fetchModerators();
    subscribeToChat();
    subscribeToGifts();
    subscribeToModeration();

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }
      if (giftChannelRef.current) {
        supabase.removeChannel(giftChannelRef.current);
      }
      if (moderationChannelRef.current) {
        supabase.removeChannel(moderationChannelRef.current);
      }
    };
  }, [
    fetchRecentMessages,
    fetchPinnedComment,
    fetchBlockedUsers,
    fetchFanClubBadges,
    fetchModerators,
    subscribeToChat,
    subscribeToGifts,
    subscribeToModeration,
  ]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleLongPressMessage = (msg: ChatMessage) => {
    if (msg.user_id === currentUserId) return; // Can't moderate yourself
    
    setSelectedMessage(msg);
    setShowCommentActions(true);
  };

  const handleLikeComment = async (messageId: string) => {
    const result = await moderationService.likeComment(messageId, currentUserId);
    if (result.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId && msg.type === 'chat'
            ? { ...msg, likes: (msg.likes || 0) + 1, isLiked: true }
            : msg
        )
      );
    }
  };

  const handleReportComment = async (msg: ChatMessage) => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: async () => {
            const result = await userBlockingService.reportComment(msg.id, currentUserId, 'Spam');
            if (result.success) {
              Alert.alert('Success', 'Comment reported successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to report comment');
            }
          },
        },
        {
          text: 'Harassment',
          onPress: async () => {
            const result = await userBlockingService.reportComment(msg.id, currentUserId, 'Harassment');
            if (result.success) {
              Alert.alert('Success', 'Comment reported successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to report comment');
            }
          },
        },
        {
          text: 'Inappropriate',
          onPress: async () => {
            const result = await userBlockingService.reportComment(msg.id, currentUserId, 'Inappropriate');
            if (result.success) {
              Alert.alert('Success', 'Comment reported successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to report comment');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (msg: ChatMessage) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${msg.users.display_name}? You won't see their messages anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const result = await userBlockingService.blockUser(currentUserId, msg.user_id);
            if (result.success) {
              Alert.alert('Success', `${msg.users.display_name} has been blocked`);
              setBlockedUserIds((prev) => new Set(prev).add(msg.user_id));
              // Remove all messages from this user
              setMessages((prev) => prev.filter((m) => m.type === 'gift' || m.user_id !== msg.user_id));
            } else {
              Alert.alert('Error', result.error || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const handleRemoveComment = async (messageId: string) => {
    Alert.alert(
      'Remove Comment',
      'Are you sure you want to remove this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.removeComment(messageId);
            if (result.success) {
              setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
              
              // Broadcast removal
              await supabase.channel(`stream:${streamId}:moderation`).send({
                type: 'broadcast',
                event: 'comment_removed',
                payload: { message_id: messageId },
              });
            } else {
              Alert.alert('Error', result.error || 'Failed to remove comment');
            }
          },
        },
      ]
    );
  };

  const handlePinComment = async (msg: ChatMessage) => {
    Alert.alert(
      'Pin Comment',
      'How long do you want to pin this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 minute', onPress: () => pinComment(msg, 1) },
        { text: '3 minutes', onPress: () => pinComment(msg, 3) },
        { text: '5 minutes', onPress: () => pinComment(msg, 5) },
      ]
    );
  };

  const pinComment = async (msg: ChatMessage, duration: number) => {
    const result = await moderationService.pinComment(streamId, msg.id, currentUserId, duration);
    if (result.success) {
      fetchPinnedComment();
      
      // Broadcast pin
      await supabase.channel(`stream:${streamId}:moderation`).send({
        type: 'broadcast',
        event: 'comment_pinned',
        payload: { message_id: msg.id },
      });
    } else {
      Alert.alert('Error', result.error || 'Failed to pin comment');
    }
  };

  const handleUnpinComment = async () => {
    const result = await moderationService.unpinComment(streamId);
    if (result.success) {
      setPinnedComment(null);
      
      // Broadcast unpin
      await supabase.channel(`stream:${streamId}:moderation`).send({
        type: 'broadcast',
        event: 'comment_unpinned',
        payload: {},
      });
    } else {
      Alert.alert('Error', result.error || 'Failed to unpin comment');
    }
  };

  const renderBadges = (userId: string) => {
    const badges = [];

    // Moderator badge
    if (moderatorIds.has(userId)) {
      badges.push(
        <View key="mod" style={[styles.badge, { backgroundColor: colors.gradientEnd }]}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="shield"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>MOD</Text>
        </View>
      );
    }

    // Fan club badge
    const fanBadge = fanClubBadges.get(userId);
    if (fanBadge) {
      badges.push(
        <View key="fan" style={[styles.badge, { backgroundColor: fanBadge.color }]}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>{fanBadge.name}</Text>
        </View>
      );
    }

    return badges.length > 0 ? <View style={styles.badgeContainer}>{badges}</View> : null;
  };

  const renderMessage = (msg: Message, index: number) => {
    if (msg.type === 'gift') {
      return (
        <FadingMessage key={msg.id} delay={3000}>
          <View style={styles.giftMessage}>
            <View style={styles.giftIconContainer}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={16}
                color="#FFD700"
              />
            </View>
            <Text style={styles.giftText}>
              <Text style={styles.giftSender}>{msg.sender_username}</Text>
              {' sent '}
              <Text style={styles.giftName}>{msg.gift_name}</Text>
              {' worth '}
              <Text style={styles.giftAmount}>{msg.amount} kr!</Text>
            </Text>
          </View>
        </FadingMessage>
      );
    }

    // Don't render messages from blocked users
    if (blockedUserIds.has(msg.user_id)) {
      return null;
    }

    const canModerate = isStreamer || isModerator;
    const isOwnMessage = msg.user_id === currentUserId;

    return (
      <FadingMessage key={index} delay={5000}>
        <TouchableOpacity
          style={styles.chatMessage}
          onLongPress={() => handleLongPressMessage(msg)}
          delayLongPress={500}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatUsername}>{msg.users.display_name}</Text>
            {renderBadges(msg.user_id)}
          </View>
          <Text style={styles.chatText}>{msg.message}</Text>
          
          <View style={styles.messageActions}>
            {/* Like button (everyone can like) */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikeComment(msg.id)}
            >
              <IconSymbol
                ios_icon_name={msg.isLiked ? "heart.fill" : "heart"}
                android_material_icon_name={msg.isLiked ? "favorite" : "favorite_border"}
                size={14}
                color={msg.isLiked ? colors.gradientEnd : colors.text}
              />
              {msg.likes && msg.likes > 0 && (
                <Text style={styles.likeCount}>{msg.likes}</Text>
              )}
            </TouchableOpacity>

            {/* Report button (viewers only, not own messages) */}
            {!canModerate && !isOwnMessage && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleReportComment(msg)}
              >
                <IconSymbol
                  ios_icon_name="flag"
                  android_material_icon_name="flag"
                  size={14}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}

            {/* Block button (viewers only, not own messages) */}
            {!canModerate && !isOwnMessage && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleBlockUser(msg)}
              >
                <IconSymbol
                  ios_icon_name="hand.raised"
                  android_material_icon_name="block"
                  size={14}
                  color={colors.gradientEnd}
                />
              </TouchableOpacity>
            )}

            {/* Moderator actions */}
            {canModerate && !isOwnMessage && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handlePinComment(msg)}
                >
                  <IconSymbol
                    ios_icon_name="pin"
                    android_material_icon_name="push_pin"
                    size={14}
                    color={colors.text}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveComment(msg.id)}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={14}
                    color={colors.gradientEnd}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </FadingMessage>
    );
  };

  return (
    <View style={styles.container}>
      {/* Pinned Comment */}
      {pinnedComment && (
        <View style={styles.pinnedContainer}>
          <View style={styles.pinnedHeader}>
            <IconSymbol
              ios_icon_name="pin.fill"
              android_material_icon_name="push_pin"
              size={16}
              color={colors.gradientEnd}
            />
            <Text style={styles.pinnedLabel}>Pinned</Text>
            {(isStreamer || isModerator) && (
              <TouchableOpacity onPress={handleUnpinComment}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={16}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chatHeader}>
            <Text style={styles.pinnedUsername}>
              {pinnedComment.chat_messages?.users?.display_name}
            </Text>
            {renderBadges(pinnedComment.chat_messages?.user_id)}
          </View>
          <Text style={styles.pinnedText}>{pinnedComment.chat_messages?.message}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.slice(-15).map(renderMessage)}
      </ScrollView>

      {selectedMessage && (
        <UserActionModal
          visible={showUserActionModal}
          onClose={() => {
            setShowUserActionModal(false);
            setSelectedMessage(null);
          }}
          userId={selectedMessage.user_id}
          username={selectedMessage.users.display_name}
          streamId={streamId}
          streamerId={streamerId}
          currentUserId={currentUserId}
          isStreamer={isStreamer}
          isModerator={isModerator}
        />
      )}
    </View>
  );
}

function FadingMessage({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    bottom: 140,
    width: '65%',
    maxHeight: 400,
  },
  pinnedContainer: {
    backgroundColor: 'rgba(227, 0, 82, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pinnedLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  pinnedUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  pinnedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 8,
  },
  chatMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gradientEnd,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  chatUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text,
  },
  chatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 18,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  giftMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 0, 82, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    gap: 8,
  },
  giftIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  giftSender: {
    fontWeight: '800',
    color: '#FFD700',
  },
  giftName: {
    fontWeight: '800',
    color: colors.text,
  },
  giftAmount: {
    fontWeight: '800',
    color: '#FFD700',
  },
});
