
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import { recommendationService } from '@/app/services/recommendationService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 6) / 2;

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [growingFast, setGrowingFast] = useState<any[]>([]);
  const [mostSupported, setMostSupported] = useState<any[]>([]);
  const [mostGifted, setMostGifted] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExploreContent = useCallback(async () => {
    try {
      const [trending, growing, supported, gifted, live] = await Promise.all([
        recommendationService.getTrendingCreators(10),
        recommendationService.getGrowingFastCreators(10),
        recommendationService.getMostSupportedCreators(10),
        recommendationService.getMostGiftedStreams(10),
        recommendationService.getRecommendedLiveStreams(20),
      ]);

      setTrendingCreators(trending);
      setGrowingFast(growing);
      setMostSupported(supported);
      setMostGifted(gifted);
      setLiveStreams(live);
    } catch (error) {
      console.error('Error fetching explore content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreContent();
  }, [fetchExploreContent]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExploreContent();
  };

  const handleSearchPress = () => {
    router.push('/screens/SearchScreen');
  };

  const handleStreamPress = (streamId: string) => {
    router.push({
      pathname: '/live-player',
      params: { streamId },
    });
  };

  const handleCreatorPress = (userId: string) => {
    router.push(`/screens/PublicProfileScreen?userId=${userId}`);
  };

  const renderCreatorRow = (title: string, emoji: string, creators: any[]) => {
    if (creators.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {emoji} {title}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {creators.map((creator) => (
            <TouchableOpacity
              key={creator.id}
              style={[styles.creatorCard, { backgroundColor: colors.card }]}
              onPress={() => handleCreatorPress(creator.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                }}
                style={styles.creatorAvatar}
              />
              <Text style={[styles.creatorName, { color: colors.text }]} numberOfLines={1}>
                {creator.display_name || creator.username}
              </Text>
              <Text style={[styles.creatorStats, { color: colors.textSecondary }]}>
                {creator.followers_count || 0} followers
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
        <TouchableOpacity 
          style={[styles.searchContainer, { backgroundColor: colors.backgroundAlt }]} 
          onPress={handleSearchPress} 
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.searchPlaceholder, { color: colors.placeholder }]}>Search...</Text>
        </TouchableOpacity>
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading content...</Text>
          </View>
        ) : (
          <>
            {/* Live Streams Grid */}
            {liveStreams.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔴 Live Now</Text>
                <View style={styles.grid}>
                  {liveStreams.slice(0, 6).map((stream) => (
                    <TouchableOpacity
                      key={stream.id}
                      style={[styles.card, { backgroundColor: colors.card }]}
                      onPress={() => handleStreamPress(stream.id)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{
                          uri: stream.users?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                        }}
                        style={styles.cardImage}
                      />
                      <View style={styles.cardOverlay}>
                        <View style={styles.cardTopBar}>
                          <LiveBadge size="small" />
                          <View style={styles.viewerBadge}>
                            <IconSymbol
                              ios_icon_name="eye.fill"
                              android_material_icon_name="visibility"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.viewerCount}>{stream.viewer_count || 0}</Text>
                          </View>
                        </View>

                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {stream.title}
                          </Text>
                          <Text style={styles.cardSubtitle} numberOfLines={1}>
                            {stream.users?.display_name}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Creators */}
            {renderCreatorRow('Trending Creators', '🔥', trendingCreators)}

            {/* Growing Fast */}
            {renderCreatorRow('Growing Fast', '✨', growingFast)}

            {/* Most Supported */}
            {renderCreatorRow('Most Supported', '🎁', mostSupported)}

            {/* Most Gifted Streams */}
            {mostGifted.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📈 Most Gifted Streams</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {mostGifted.map((stream) => (
                    <TouchableOpacity
                      key={stream.id}
                      style={[styles.streamCard, { backgroundColor: colors.card }]}
                      onPress={() => handleStreamPress(stream.id)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri: stream.users?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                        }}
                        style={styles.streamCardImage}
                      />
                      <View style={styles.streamCardOverlay}>
                        <LiveBadge size="small" />
                      </View>
                      <View style={styles.streamCardInfo}>
                        <Text style={[styles.streamCardTitle, { color: colors.text }]} numberOfLines={1}>
                          {stream.title}
                        </Text>
                        <Text style={[styles.streamCardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {stream.users?.display_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
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
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    gap: 2,
  },
  card: {
    width: cardWidth,
    aspectRatio: 9 / 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardInfo: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  creatorCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  creatorStats: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  streamCard: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  streamCardImage: {
    width: '100%',
    height: 120,
  },
  streamCardOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  streamCardInfo: {
    padding: 12,
    gap: 4,
  },
  streamCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  streamCardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});
