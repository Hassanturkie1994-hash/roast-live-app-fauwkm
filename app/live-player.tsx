
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import LiveBadge from '@/components/LiveBadge';
import FollowButton from '@/components/FollowButton';
import ChatBubble, { ChatMessage } from '@/components/ChatBubble';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

const { height: screenHeight } = Dimensions.get('window');

const mockMessages: ChatMessage[] = [
  { id: '1', username: 'User1', message: 'This is awesome!', timestamp: Date.now() },
  { id: '2', username: 'User2', message: 'Great stream!', timestamp: Date.now() },
  { id: '3', username: 'User3', message: 'Keep it up!', timestamp: Date.now() },
];

export default function LivePlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewerCount, setViewerCount] = useState(12500);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 10 - 3));
      
      if (Math.random() > 0.7) {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          username: `User${Math.floor(Math.random() * 1000)}`,
          message: ['Amazing!', 'Love this!', 'So cool!', 'Keep going!'][Math.floor(Math.random() * 4)],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev.slice(-10), newMessage]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'You',
        message: inputMessage.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage('');
    }
  };

  const handleFollowPress = () => {
    setIsFollowing(!isFollowing);
    console.log('Follow button pressed');
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.videoContainer}>
        <LinearGradient
          colors={['#1a1a1a', '#0a0a0a']}
          style={styles.videoPlaceholder}
        >
          <IconSymbol
            ios_icon_name="play.circle.fill"
            android_material_icon_name="play_circle_filled"
            size={80}
            color={colors.textSecondary}
          />
          <Text style={styles.videoPlaceholderText}>Live Stream Video</Text>
          <Text style={styles.videoNote}>
            Note: Video playback requires expo-video integration
          </Text>
        </LinearGradient>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.topBar}>
          <LiveBadge size="small" />
          <View style={styles.viewerContainer}>
            <IconSymbol
              ios_icon_name="eye.fill"
              android_material_icon_name="visibility"
              size={14}
              color={colors.text}
            />
            <Text style={styles.viewerCount}>{formatViewerCount(viewerCount)}</Text>
          </View>
        </View>

        <View style={styles.followButtonContainer}>
          <FollowButton isFollowing={isFollowing} onPress={handleFollowPress} size="small" />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Live Chat</Text>
          <TouchableOpacity onPress={() => setShowChat(!showChat)}>
            <IconSymbol
              ios_icon_name={showChat ? 'chevron.down' : 'chevron.up'}
              android_material_icon_name={showChat ? 'expand_more' : 'expand_less'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {showChat && (
          <>
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => (
                <React.Fragment key={index}>
                  <ChatBubble message={message} index={index} />
                </React.Fragment>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Send a message..."
                placeholderTextColor={colors.placeholder}
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="paperplane.fill"
                    android_material_icon_name="send"
                    size={20}
                    color={colors.text}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function formatViewerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: screenHeight * 0.4,
    backgroundColor: colors.backgroundAlt,
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  videoNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
