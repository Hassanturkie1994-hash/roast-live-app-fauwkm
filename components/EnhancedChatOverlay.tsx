
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

  const renderMessage = (msg: Message, index: number) => {
    if (msg.type === 'gift') {
      return (
        <FadingMessage key={msg.id} delay={3000}>
          <View style={styles.giftMessage}>
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

    return (
      <FadingMessage key={index} delay={5000}>
        <View style={styles.chatMessage}>
          <Text style={styles.chatUsername}>{msg.users.display_name}:</Text>
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
    bottom: 120,
    width: '60%',
    maxHeight: 300,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 8,
  },
  chatMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  chatUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gradientEnd,
    marginBottom: 2,
  },
  chatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  giftMessage: {
    backgroundColor: 'rgba(227, 0, 82, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  giftText: {
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
