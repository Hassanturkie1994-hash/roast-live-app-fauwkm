
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { streamGuestService, GuestEvent } from '@/app/services/streamGuestService';

type ChatMessage = Tables<'chat_messages'> & {
  users: Tables<'users'>;
};

interface EnhancedChatOverlayProps {
  streamId: string;
  isBroadcaster?: boolean;
  streamDelay?: number;
}

export default function EnhancedChatOverlay({
  streamId,
  isBroadcaster = false,
  streamDelay = 0,
}: EnhancedChatOverlayProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guestEvents, setGuestEvents] = useState<GuestEvent[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);
  const guestEventsChannelRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchRecentMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching chat messages:', error);
        return;
      }

      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error in fetchRecentMessages:', error);
    }
  }, [streamId]);

  const fetchRecentGuestEvents = useCallback(async () => {
    try {
      const events = await streamGuestService.getGuestEvents(streamId, 20);
      setGuestEvents(events);
    } catch (error) {
      console.error('Error fetching guest events:', error);
    }
  }, [streamId]);

  const subscribeToChat = useCallback(() => {
    const channel = supabase
      .channel(`stream:${streamId}:chat`)
      .on('broadcast', { event: 'message' }, async (payload) => {
        console.log('New chat message:', payload);
        const newMessage = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, newMessage]);

        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .subscribe();

    channelRef.current = channel;
  }, [streamId, fadeAnim]);

  const subscribeToGuestEvents = useCallback(() => {
    const channel = streamGuestService.subscribeToGuestEvents(streamId, (payload) => {
      console.log('New guest event:', payload);
      const newEvent = payload.new as GuestEvent;
      setGuestEvents((prev) => [newEvent, ...prev].slice(0, 20));
    });

    guestEventsChannelRef.current = channel;
  }, [streamId]);

  useEffect(() => {
    fetchRecentMessages();
    fetchRecentGuestEvents();
    subscribeToChat();
    subscribeToGuestEvents();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (guestEventsChannelRef.current) {
        supabase.removeChannel(guestEventsChannelRef.current);
      }
    };
  }, [fetchRecentMessages, fetchRecentGuestEvents, subscribeToChat, subscribeToGuestEvents]);

  useEffect(() => {
    if (messages.length > 0 || guestEvents.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, guestEvents]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    try {
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: messageText.trim(),
        })
        .select('*, users(*)')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      if (channelRef.current && newMessage) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'message',
          payload: newMessage,
        });
      }

      setMessageText('');
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  };

  const renderGuestEvent = (event: GuestEvent, index: number) => {
    const getEventMessage = () => {
      switch (event.event_type) {
        case 'joined_live':
          return `${event.display_name} joined live`;
        case 'left_live':
          return `${event.display_name} left live`;
        case 'muted_mic':
          return `${event.display_name} muted mic`;
        case 'unmuted_mic':
          return `${event.display_name} unmuted mic`;
        case 'enabled_camera':
          return `${event.display_name} enabled camera`;
        case 'disabled_camera':
          return `${event.display_name} disabled camera`;
        case 'host_removed':
          return `Host removed ${event.display_name}`;
        case 'became_moderator':
          return `${event.display_name} is now moderator`;
        case 'removed_moderator':
          return `${event.display_name} is no longer moderator`;
        case 'kicked':
          return `${event.display_name} was kicked`;
        case 'timed_out':
          return `${event.display_name} was timed out`;
        default:
          return `${event.display_name} ${event.event_type}`;
      }
    };

    return (
      <View key={`event-${index}`} style={styles.guestEvent}>
        <IconSymbol
          ios_icon_name="person.2.fill"
          android_material_icon_name="people"
          size={14}
          color={colors.gradientEnd}
        />
        <Text style={styles.guestEventText}>{getEventMessage()}</Text>
      </View>
    );
  };

  const renderMessage = (msg: ChatMessage, index: number) => (
    <Animated.View
      key={`msg-${index}`}
      style={[
        styles.chatMessage,
        index === messages.length - 1 && { opacity: fadeAnim },
      ]}
    >
      <Text style={styles.chatUsername}>{msg.users.display_name}:</Text>
      <Text style={styles.chatText}>{msg.message}</Text>
    </Animated.View>
  );

  // Combine and sort messages and events by timestamp
  const combinedItems = [
    ...messages.map((msg) => ({ type: 'message' as const, data: msg, timestamp: msg.created_at })),
    ...guestEvents.map((event) => ({ type: 'event' as const, data: event, timestamp: event.created_at })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (isBroadcaster) {
    return (
      <View style={styles.broadcasterChatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.broadcasterChatMessages}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={false}
        >
          {combinedItems.slice(-10).map((item, index) =>
            item.type === 'message'
              ? renderMessage(item.data as ChatMessage, index)
              : renderGuestEvent(item.data as GuestEvent, index)
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.viewerChatContainer, isExpanded && styles.viewerChatExpanded]}
    >
      <TouchableOpacity
        style={styles.chatToggle}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <IconSymbol
          ios_icon_name="bubble.left.fill"
          android_material_icon_name="chat"
          size={20}
          color={colors.text}
        />
        <Text style={styles.chatToggleText}>
          {isExpanded ? 'Hide Chat' : 'Show Chat'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.viewerChatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
          >
            {combinedItems.map((item, index) =>
              item.type === 'message'
                ? renderMessage(item.data as ChatMessage, index)
                : renderGuestEvent(item.data as GuestEvent, index)
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Send a message..."
              placeholderTextColor={colors.placeholder}
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  broadcasterChatContainer: {
    position: 'absolute',
    left: 16,
    bottom: 140,
    width: '55%',
    maxHeight: 250,
  },
  broadcasterChatMessages: {
    maxHeight: 250,
  },
  chatMessagesContent: {
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
  guestEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 0, 40, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  guestEventText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontStyle: 'italic',
  },
  viewerChatContainer: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    width: '60%',
    maxHeight: 60,
  },
  viewerChatExpanded: {
    maxHeight: 350,
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 8,
  },
  chatToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  viewerChatMessages: {
    maxHeight: 250,
    marginBottom: 8,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
  },
});
