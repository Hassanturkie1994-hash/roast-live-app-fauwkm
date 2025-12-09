
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { savedStreamService } from '@/app/services/savedStreamService';

interface SavedStream {
  id: string;
  title: string;
  recording_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  created_at: string;
}

export default function SavedStreamsScreen() {
  const { user } = useAuth();
  const [savedStreams, setSavedStreams] = useState<SavedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedStreams = useCallback(async () => {
    if (!user) return;

    try {
      const result = await savedStreamService.getSavedStreams(user.id);
      if (result.success) {
        setSavedStreams(result.data);
      }
    } catch (error) {
      console.error('Error fetching saved streams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      fetchSavedStreams();
    }
  }, [user, fetchSavedStreams]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedStreams();
  };

  const handleStreamPress = (stream: SavedStream) => {
    if (stream.recording_url) {
      router.push({
        pathname: '/screens/StreamReplayScreen',
        params: { streamId: stream.id, recordingUrl: stream.recording_url },
      });
    } else {
      Alert.alert('Not Available', 'Recording is not available for this stream');
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!user) return;

    Alert.alert('Delete Stream', 'Are you sure you want to delete this saved stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await savedStreamService.deleteSavedStream(user.id, streamId);
          if (result.success) {
            setSavedStreams((prev) => prev.filter((s) => s.id !== streamId));
            Alert.alert('Success', 'Stream deleted successfully');
          } else {
            Alert.alert('Error', 'Failed to delete stream');
          }
        },
      },
    ]);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="arrow.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Streams</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading saved streams...</Text>
          </View>
        ) : savedStreams.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="video.slash"
              android_material_icon_name="videocam_off"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No saved streams</Text>
            <Text style={styles.emptySubtext}>
              Streams you save after ending will appear here
            </Text>
          </View>
        ) : (
          savedStreams.map((stream, index) => (
            <View key={index} style={styles.streamCard}>
              <TouchableOpacity
                style={styles.streamContent}
                onPress={() => handleStreamPress(stream)}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: stream.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
                  }}
                  style={styles.thumbnail}
                />
                <View style={styles.streamInfo}>
                  <Text style={styles.streamTitle} numberOfLines={2}>
                    {stream.title}
                  </Text>
                  <View style={styles.streamMeta}>
                    <View style={styles.metaItem}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.metaText}>{formatDuration(stream.duration)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <IconSymbol
                        ios_icon_name="eye.fill"
                        android_material_icon_name="visibility"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.metaText}>{stream.views_count} views</Text>
                    </View>
                  </View>
                  <Text style={styles.streamDate}>{formatDate(stream.created_at)}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteStream(stream.id)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="trash.fill"
                  android_material_icon_name="delete"
                  size={20}
                  color={colors.gradientEnd}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
  streamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  streamContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  streamInfo: {
    flex: 1,
    gap: 6,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  streamMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  streamDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
