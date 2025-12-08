
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import StreamPreviewCard, { StreamData } from '@/components/StreamPreviewCard';

const mockStreams: StreamData[] = [
  {
    id: '1',
    title: 'Epic Gaming Session - Come Join the Fun!',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    creatorName: 'GamerPro',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    viewerCount: 12500,
    isLive: true,
  },
  {
    id: '2',
    title: 'Cooking Stream - Making Pizza from Scratch',
    thumbnail: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    creatorName: 'ChefMaster',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    viewerCount: 8300,
    isLive: true,
  },
  {
    id: '3',
    title: 'Music Production Live - Creating Beats',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    creatorName: 'BeatMaker',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    viewerCount: 5600,
    isLive: true,
  },
  {
    id: '4',
    title: 'Art Stream - Digital Painting Tutorial',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    creatorName: 'ArtistPro',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    viewerCount: 3200,
    isLive: true,
  },
  {
    id: '5',
    title: 'Fitness Training - Full Body Workout',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    creatorName: 'FitCoach',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    viewerCount: 2100,
    isLive: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleStreamPress = (streamId: string) => {
    console.log('Stream pressed:', streamId);
    router.push(`/live-player?id=${streamId}`);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ROAST LIVE</Text>
          <Text style={styles.headerSubtitle}>Discover Live Streams</Text>
        </View>

        {mockStreams.map((stream, index) => (
          <React.Fragment key={index}>
            <StreamPreviewCard
              stream={stream}
              onPress={() => handleStreamPress(stream.id)}
            />
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
