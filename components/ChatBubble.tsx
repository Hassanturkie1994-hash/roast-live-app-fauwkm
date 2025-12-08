
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
}

export default function ChatBubble({ message, index }: ChatBubbleProps) {
  const usernameColor = getUsernameColor(message.username);

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(300)}
      style={styles.container}
    >
      <Text style={styles.message}>
        <Text style={[styles.username, { color: usernameColor }]}>
          {message.username}
        </Text>
        <Text style={styles.messageText}> {message.message}</Text>
      </Text>
    </Animated.View>
  );
}

function getUsernameColor(username: string): string {
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash % 360);
  const saturation = 70;
  const lightness = 60;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    maxWidth: '80%',
  },
  message: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '400',
  },
});
