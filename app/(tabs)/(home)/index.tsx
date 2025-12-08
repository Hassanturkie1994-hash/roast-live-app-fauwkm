
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import StreamPreviewCard from '@/components/StreamPreviewCard';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Stream = Tables<'streams'> & {
  users: Tables<'users'>;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'following' | 'recommended'>('recommended');
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveStreams = useCallback(async () => {
    try {
      let query = supabase
        .from('streams')
        .select('*, users(*)')
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      // If "Following" tab and user is logged in, filter by followed users
      if (activeTab === 'following' && user) {
        const { data: following } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followingIds = following.map((f) => f.following_id);
          query = query.in('broadcaster_id', followingIds);
        } else {
          // No following, show empty
          setLiveStreams([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching live streams:', error);
        return;
      }

      setLiveStreams(data as Stream[]);
    } catch (error) {
      console.error('Error in fetchLiveStreams:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    fetchLiveStreams();
    
    // Subscribe to new streams
    const channel = supabase
      .channel('live-streams')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'streams',
          filter: 'status=eq.live',
        },
        () => {
          console.log('New live stream detected');
          fetchLiveStreams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
        },
        () => {
          console.log('Stream updated');
          fetchLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveStreams]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLiveStreams();
  };

  const handleStreamPress = (streamId: string) => {
    router.push(`/live-player?streamId=${streamId}`);
  };

  const renderEmptyState = () => {
    if (activeTab === 'following' && !user) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="person.fill.questionmark"
            android_material_icon_name="person"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Login to See Following</Text>
          <Text style={styles.emptyText}>
            Login to see live streams from people you follow
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <IconSymbol
          ios_icon_name="video.slash.fill"
          android_material_icon_name="videocam_off"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>No Live Streams</Text>
        <Text style={styles.emptyText}>
          {activeTab === 'following'
            ? 'None of the people you follow are live right now'
            : 'No one is streaming right now. Be the first to go live!'}
        </Text>
        {activeTab === 'recommended' && (
          <TouchableOpacity
            style={styles.goLiveButton}
            onPress={() => router.push('/(tabs)/broadcaster')}
          >
            <Text style={styles.goLiveButtonText}>Go Live</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <RoastLiveLogo size="medium" />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommended' && styles.tabActive]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>
            Recommended
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gradientEnd}
            colors={[colors.gradientEnd]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading live streams...</Text>
          </View>
        ) : liveStreams.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.streamsGrid}>
            {liveStreams.map((stream, index) => (
              <StreamPreviewCard
                key={index}
                stream={stream}
                onPress={() => handleStreamPress(stream.id)}
              />
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  tabActive: {
    backgroundColor: colors.gradientEnd,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loginButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  goLiveButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.gradientEnd,
    borderRadius: 25,
  },
  goLiveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  streamsGrid: {
    gap: 16,
  },
});
