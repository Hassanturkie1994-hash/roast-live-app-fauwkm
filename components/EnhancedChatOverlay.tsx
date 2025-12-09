
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { IconSymbol } from '@/components/IconSymbol';

type ChatMessage = Tables<'chat_messages'> & {
  users: Tables<'users'>;
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
}

export default function EnhancedChatOverlay({ streamId }: EnhancedChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatChannelRef = useRef<any>(null);
  const giftChannelRef = useRef<any>(null);

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

  const subscribeToChat = useCallback(() => {
    const chatChannel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'message' }, (payload) => {
        console.log('💬 New chat message received:', payload);
        const newMessage: Message = {
          ...payload.payload,
          type: 'chat' as const,
        };
        setMessages((prev) => [...prev, newMessage]);
      })
      .subscribe();

    chatChannelRef.current = chatChannel;
  }, [streamId]);

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

  useEffect(() => {
    fetchRecentMessages();
    subscribeToChat();
    subscribeToGifts();

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }
      if (giftChannelRef.current) {
        supabase.removeChannel(giftChannelRef.current);
      }
    };
  }, [fetchRecentMessages, subscribeToChat, subscribeToGifts]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderBadge = (badgeType?: string) => {
    if (!badgeType) return null;

    let badgeIcon = 'star.fill';
    let badgeColor = '#FFD700';

    if (badgeType === 'moderator') {
      badgeIcon = 'shield.fill';
      badgeColor = colors.gradientEnd;
    } else if (badgeType === 'fan') {
      badgeIcon = 'heart.fill';
      badgeColor = '#FF1493';
    }

    return (
      <View style={styles.badge}>
        <IconSymbol
          ios_icon_name={badgeIcon}
          android_material_icon_name={badgeType === 'moderator' ? 'shield' : 'star'}
          size={12}
          color={badgeColor}
        />
      </View>
    );
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

    // For chat messages, check if user has a badge
    const userBadge = msg.users?.badge_type;

    return (
      <FadingMessage key={index} delay={5000}>
        <View style={styles.chatMessage}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatUsername}>{msg.users.display_name}</Text>
            {renderBadge(userBadge)}
          </View>
          <Text style={styles.chatText}>{msg.message}</Text>
        </View>
      </FadingMessage>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.slice(-15).map(renderMessage)}
      </ScrollView>
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
    maxHeight: 350,
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
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 18,
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
