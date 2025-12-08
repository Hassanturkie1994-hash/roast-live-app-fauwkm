
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*, users(*)')
        .eq('status', 'live')
        .order('viewer_count', { ascending: false });

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

  const filteredStreams = streams.filter(
    (stream) =>
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.users.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <RoastLiveLogo size="medium" />
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search streams or creators..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading streams...</Text>
          </View>
        ) : filteredStreams.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="video.slash"
              android_material_icon_name="videocam_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No streams found' : 'No live streams'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Check back later!'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredStreams.map((stream, index) => (
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
                        size={12}
                        color={colors.text}
                      />
                      <Text style={styles.viewerCount}>{stream.viewer_count || 0}</Text>
                    </View>
                  </View>

                  <View style={styles.streamInfo}>
                    <Text style={styles.broadcasterName}>{stream.users.display_name}</Text>
                    <Text style={styles.streamTitle} numberOfLines={2}>
                      {stream.title}
                    </Text>
                  </View>
                </View>
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
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  streamCard: {
    width: '48%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
  },
  streamOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
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
  streamInfo: {
    gap: 4,
  },
  broadcasterName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  streamTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 16,
  },
});
