
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 6) / 2;

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

type Post = Tables<'posts'> & {
  profiles: Tables<'profiles'>;
};

interface ExploreItem {
  type: 'post' | 'stream';
  data: Post | Stream;
  id: string;
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExploreContent = useCallback(async () => {
    try {
      const [postsResult, streamsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('streams')
          .select('*, users(*)')
          .eq('status', 'live')
          .order('viewer_count', { ascending: false })
          .limit(10),
      ]);

      const posts: ExploreItem[] = (postsResult.data || []).map((post) => ({
        type: 'post' as const,
        data: post as Post,
        id: `post-${post.id}`,
      }));

      const streams: ExploreItem[] = (streamsResult.data || []).map((stream) => ({
        type: 'stream' as const,
        data: stream as Stream,
        id: `stream-${stream.id}`,
      }));

      const mixed = [...streams, ...posts].sort(() => Math.random() - 0.5);
      setItems(mixed);
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

  const handleItemPress = (item: ExploreItem) => {
    if (item.type === 'stream') {
      const stream = item.data as Stream;
      router.push({
        pathname: '/live-player',
        params: { streamId: stream.id },
      });
    } else {
      const post = item.data as Post;
      router.push(`/screens/PostDetailScreen?postId=${post.id}`);
    }
  };

  const handleSearchPress = () => {
    router.push('/screens/SearchScreen');
  };

  const filteredItems = searchQuery
    ? items.filter((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          return (
            post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          const stream = item.data as Stream;
          return (
            stream.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stream.users?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      })
    : items;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress} activeOpacity={0.7}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.searchPlaceholder}>Search...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="photo.on.rectangle"
              android_material_icon_name="photo_library"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No content available</Text>
            <Text style={styles.emptySubtext}>Check back later for new posts and streams!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.9}
              >
                {item.type === 'stream' ? (
                  <>
                    <Image
                      source={{
                        uri:
                          (item.data as Stream).users?.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
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
                            color={colors.text}
                          />
                          <Text style={styles.viewerCount}>{(item.data as Stream).viewer_count || 0}</Text>
                        </View>
                      </View>

                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {(item.data as Stream).title}
                        </Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {(item.data as Stream).users?.display_name}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Image source={{ uri: (item.data as Post).media_url }} style={styles.cardImage} />
                    <View style={styles.cardOverlay}>
                      <View style={styles.cardInfo}>
                        <View style={styles.postStats}>
                          <View style={styles.postStat}>
                            <IconSymbol
                              ios_icon_name="heart.fill"
                              android_material_icon_name="favorite"
                              size={14}
                              color={colors.text}
                            />
                            <Text style={styles.postStatText}>{(item.data as Post).likes_count || 0}</Text>
                          </View>
                          <View style={styles.postStat}>
                            <IconSymbol
                              ios_icon_name="bubble.left.fill"
                              android_material_icon_name="comment"
                              size={14}
                              color={colors.text}
                            />
                            <Text style={styles.postStatText}>{(item.data as Post).comments_count || 0}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          @{(item.data as Post).profiles?.username}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.placeholder,
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
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    paddingTop: 2,
    gap: 2,
  },
  card: {
    width: cardWidth,
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  cardInfo: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
});
