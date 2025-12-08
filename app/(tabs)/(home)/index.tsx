
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

const { height: screenHeight } = Dimensions.get('window');

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

type TabType = 'following' | 'recommended' | 'explore';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabType>('recommended');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else {
        fetchStreams();
      }
    }
  }, [user, authLoading]);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching streams:', error);
        return;
      }

      setStreams(data as Stream[]);
    } catch (error) {
      console.error('Error in fetchStreams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStreams();
  };

  const handleStreamPress = (stream: Stream) => {
    router.push({
      pathname: '/live-player',
      params: { streamId: stream.id },
    });
  };

  if (authLoading || loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <RoastLiveLogo size="medium" />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'following' && styles.tabActive]}
          onPress={() => setSelectedTab('following')}
        >
          <Text style={[styles.tabText, selectedTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'recommended' && styles.tabActive]}
          onPress={() => setSelectedTab('recommended')}
        >
          <Text style={[styles.tabText, selectedTab === 'recommended' && styles.tabTextActive]}>
            Recommended
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'explore' && styles.tabActive]}
          onPress={() => setSelectedTab('explore')}
        >
          <Text style={[styles.tabText, selectedTab === 'explore' && styles.tabTextActive]}>
            Explore
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {streams.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="video.slash"
              android_material_icon_name="videocam_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No live streams at the moment</Text>
            <Text style={styles.emptySubtext}>Check back later or start your own stream!</Text>
          </View>
        ) : (
          streams.map((stream, index) => (
            <TouchableOpacity
              key={index}
              style={styles.streamCard}
              onPress={() => handleStreamPress(stream)}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: stream.users.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
                }}
                style={styles.streamThumbnail}
              />
              <View style={styles.streamOverlay}>
                <View style={styles.streamTopBar}>
                  <LiveBadge size="small" />
                  <View style={styles.viewerBadge}>
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={14}
                      color={colors.text}
                    />
                    <Text style={styles.viewerCount}>{stream.viewer_count || 0}</Text>
                  </View>
                </View>

                <View style={styles.streamInfo}>
                  <View style={styles.broadcasterInfo}>
                    <Image
                      source={{
                        uri: stream.users.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                      }}
                      style={styles.broadcasterAvatar}
                    />
                    <View style={styles.broadcasterDetails}>
                      <Text style={styles.broadcasterName}>{stream.users.display_name}</Text>
                      <Text style={styles.streamTitle} numberOfLines={2}>
                        {stream.title}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
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
  streamCard: {
    width: '100%',
    height: screenHeight * 0.6,
    backgroundColor: colors.card,
    marginBottom: 2,
    position: 'relative',
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
  },
  streamOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  streamTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  viewerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  streamInfo: {
    gap: 12,
  },
  broadcasterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  broadcasterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.text,
  },
  broadcasterDetails: {
    flex: 1,
  },
  broadcasterName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 18,
  },
});
