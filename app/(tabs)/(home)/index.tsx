
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import LiveBadge from '@/components/LiveBadge';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface StreamData {
  id: string;
  title: string;
  thumbnail: string;
  creatorName: string;
  creatorAvatar: string;
  viewerCount: number;
  isLive: boolean;
  likes: number;
  comments: number;
}

const mockStreams: StreamData[] = [
  {
    id: '1',
    title: 'Epic Gaming Session - Come Join the Fun!',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    creatorName: 'GamerPro',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    viewerCount: 12500,
    isLive: true,
    likes: 8500,
    comments: 342,
  },
  {
    id: '2',
    title: 'Cooking Stream - Making Pizza from Scratch',
    thumbnail: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    creatorName: 'ChefMaster',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    viewerCount: 8300,
    isLive: true,
    likes: 5200,
    comments: 189,
  },
  {
    id: '3',
    title: 'Music Production Live - Creating Beats',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    creatorName: 'BeatMaker',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    viewerCount: 5600,
    isLive: true,
    likes: 3400,
    comments: 156,
  },
  {
    id: '4',
    title: 'Art Stream - Digital Painting Tutorial',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    creatorName: 'ArtistPro',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    viewerCount: 3200,
    isLive: true,
    likes: 2100,
    comments: 98,
  },
  {
    id: '5',
    title: 'Fitness Training - Full Body Workout',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    creatorName: 'FitCoach',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    viewerCount: 2100,
    isLive: true,
    likes: 1800,
    comments: 67,
  },
];

type FeedSegment = 'Following' | 'Recommended' | 'Explore';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedSegment, setSelectedSegment] = useState<FeedSegment>('Recommended');
  const [likedStreams, setLikedStreams] = useState<Set<string>>(new Set());

  const handleStreamPress = (streamId: string) => {
    console.log('Stream pressed:', streamId);
    router.push(`/live-player?id=${streamId}`);
  };

  const handleLike = (streamId: string) => {
    setLikedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
  };

  const renderStream = ({ item, index }: { item: StreamData; index: number }) => (
    <TouchableOpacity
      key={index}
      style={styles.streamContainer}
      activeOpacity={1}
      onPress={() => handleStreamPress(item.id)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.gradient}
      />

      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ROAST LIVE</Text>
        </View>
        <View style={styles.viewerContainer}>
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={14}
            color={colors.text}
          />
          <Text style={styles.viewerCount}>{formatCount(item.viewerCount)}</Text>
        </View>
      </View>

      <View style={styles.liveBadgeContainer}>
        <LiveBadge size="small" />
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <IconSymbol
            ios_icon_name={likedStreams.has(item.id) ? 'heart.fill' : 'heart'}
            android_material_icon_name="favorite"
            size={32}
            color={likedStreams.has(item.id) ? colors.gradientEnd : colors.text}
          />
          <Text style={styles.actionText}>{formatCount(item.likes)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            ios_icon_name="bubble.left.fill"
            android_material_icon_name="chat_bubble"
            size={32}
            color={colors.text}
          />
          <Text style={styles.actionText}>{formatCount(item.comments)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            ios_icon_name="arrowshape.turn.up.right.fill"
            android_material_icon_name="share"
            size={32}
            color={colors.text}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.creatorAvatarButton}>
          <Image source={{ uri: item.creatorAvatar }} style={styles.creatorAvatar} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.creatorName}>@{item.creatorName}</Text>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.segmentControl}>
        {(['Following', 'Recommended', 'Explore'] as FeedSegment[]).map((segment, index) => (
          <TouchableOpacity
            key={index}
            style={styles.segmentButton}
            onPress={() => setSelectedSegment(segment)}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSegment === segment && styles.segmentTextActive,
              ]}
            >
              {segment}
            </Text>
            {selectedSegment === segment && (
              <View style={styles.segmentIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={mockStreams}
        renderItem={renderStream}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight - 140}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function formatCount(count: number): string {
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
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentControl: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
    gap: 24,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  segmentIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.text,
  },
  listContent: {
    paddingBottom: 80,
  },
  streamContainer: {
    width: screenWidth,
    height: screenHeight - 140,
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
    height: '40%',
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  logoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
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
  liveBadgeContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 140,
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  creatorAvatarButton: {
    marginTop: 8,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.text,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
  },
});
