
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import StreamPreviewCard from '@/components/StreamPreviewCard';
import StoriesBar from '@/components/StoriesBar';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type Stream = Tables<'streams'>;

interface Post {
  id: string;
  user_id: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'posts'>('live');

  const fetchStreams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching streams:', error);
        return;
      }

      if (data) {
        setStreams(data);
      }
    } catch (error) {
      console.error('Error in fetchStreams:', error);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (data) {
        setPosts(data as any);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (activeTab === 'live') {
      await fetchStreams();
    } else {
      await fetchPosts();
    }
  }, [activeTab, fetchStreams, fetchPosts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleStreamPress = (stream: Stream) => {
    router.push({
      pathname: '/live-player',
      params: { streamId: stream.id },
    });
  };

  const handlePostPress = (post: Post) => {
    console.log('Post pressed:', post.id);
    // Navigate to post detail screen (to be implemented)
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.95}
    >
      <View style={styles.postHeader}>
        <Image
          source={{
            uri: item.profiles.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          }}
          style={styles.postAvatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={styles.postDisplayName}>
            {item.profiles.display_name || item.profiles.username}
          </Text>
          <Text style={styles.postUsername}>@{item.profiles.username}</Text>
        </View>
      </View>

      <Image source={{ uri: item.media_url }} style={styles.postImage} />

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="heart"
            android_material_icon_name="favorite_border"
            size={24}
            color={colors.text}
          />
          <Text style={styles.postActionText}>{item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="bubble.left"
            android_material_icon_name="comment"
            size={24}
            color={colors.text}
          />
          <Text style={styles.postActionText}>{item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postAction}>
          <IconSymbol
            ios_icon_name="paperplane"
            android_material_icon_name="send"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {item.caption && (
        <View style={styles.postCaption}>
          <Text style={styles.postCaptionUsername}>@{item.profiles.username}</Text>
          <Text style={styles.postCaptionText}> {item.caption}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'live' && styles.tabButtonActive]}
          onPress={() => setActiveTab('live')}
        >
          <IconSymbol
            ios_icon_name="video.fill"
            android_material_icon_name="videocam"
            size={20}
            color={activeTab === 'live' ? colors.text : colors.textSecondary}
          />
          <Text style={[styles.tabButtonText, activeTab === 'live' && styles.tabButtonTextActive]}>
            LIVE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('posts')}
        >
          <IconSymbol
            ios_icon_name="square.grid.2x2.fill"
            android_material_icon_name="grid_view"
            size={20}
            color={activeTab === 'posts' ? colors.text : colors.textSecondary}
          />
          <Text style={[styles.tabButtonText, activeTab === 'posts' && styles.tabButtonTextActive]}>
            POSTS
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'live' ? (
        <FlatList
          data={streams}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <StreamPreviewCard
              stream={item}
              onPress={() => handleStreamPress(item)}
            />
          )}
          ListHeaderComponent={<StoriesBar />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gradientEnd}
            />
          }
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPost}
          ListHeaderComponent={<StoriesBar />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gradientEnd}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 60,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.text,
  },
  listContent: {
    paddingBottom: 100,
  },
  postContainer: {
    backgroundColor: colors.background,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  postDisplayName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  postUsername: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  postImage: {
    width: screenWidth,
    aspectRatio: 9 / 16,
    backgroundColor: colors.backgroundAlt,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  postCaption: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  postCaptionUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  postCaptionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    flex: 1,
  },
});
