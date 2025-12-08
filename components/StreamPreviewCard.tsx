
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import LiveBadge from './LiveBadge';
import { IconSymbol } from './IconSymbol';

export interface StreamData {
  id: string;
  title: string;
  thumbnail: string;
  creatorName: string;
  creatorAvatar: string;
  viewerCount: number;
  isLive: boolean;
}

interface StreamPreviewCardProps {
  stream: StreamData;
  onPress: () => void;
}

export default function StreamPreviewCard({ stream, onPress }: StreamPreviewCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: stream.thumbnail }} style={styles.thumbnail} />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradient}
        />
        <View style={styles.badgeContainer}>
          {stream.isLive && <LiveBadge size="small" />}
        </View>
        <View style={styles.viewerCountContainer}>
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={14}
            color={colors.text}
          />
          <Text style={styles.viewerCount}>{formatViewerCount(stream.viewerCount)}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Image source={{ uri: stream.creatorAvatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {stream.title}
          </Text>
          <Text style={styles.creatorName}>{stream.creatorName}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  viewerCountContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerCount: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
});
