
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import UserActionModal from '@/components/UserActionModal';
import { fanClubService } from '@/app/services/fanClubService';
import { moderationService } from '@/app/services/moderationService';

interface ViewerListModalProps {
  visible: boolean;
  onClose: () => void;
  streamId: string;
  viewerCount: number;
  streamerId: string;
  currentUserId: string;
  isStreamer: boolean;
  isModerator: boolean;
}

type Viewer = {
  id: string;
  user_id: string;
  users: Tables<'users'>;
  joined_at: string;
};

export default function ViewerListModal({
  visible,
  onClose,
  streamId,
  viewerCount,
  streamerId,
  currentUserId,
  isStreamer,
  isModerator,
}: ViewerListModalProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState<Viewer | null>(null);
  const [showUserActionModal, setShowUserActionModal] = useState(false);
  const [fanClubBadges, setFanClubBadges] = useState<Map<string, { color: string; name: string }>>(new Map());
  const [moderatorIds, setModeratorIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      fetchViewers();
      fetchFanClubBadges();
      fetchModerators();
      
      // Auto-refresh viewer list every 5 seconds
      const interval = setInterval(fetchViewers, 5000);
      return () => clearInterval(interval);
    }
  }, [visible, streamId]);

  const fetchFanClubBadges = async () => {
    // Get fan club info
    const fanClub = await fanClubService.getFanClub(streamerId);
    if (!fanClub) return;

    // Get all members
    const members = await fanClubService.getFanClubMembers(fanClub.id);
    const badgeMap = new Map();
    members.forEach((member) => {
      badgeMap.set(member.user_id, {
        color: fanClub.badge_color,
        name: fanClub.club_name,
      });
    });
    setFanClubBadges(badgeMap);
  };

  const fetchModerators = async () => {
    const mods = await moderationService.getModerators(streamerId);
    const modIds = new Set(mods.map((m) => m.user_id));
    setModeratorIds(modIds);
  };

  const fetchViewers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*, users(*)')
        .eq('stream_id', streamId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching viewers:', error);
        return;
      }

      console.log('👥 Fetched viewers:', data?.length || 0);
      setViewers(data as Viewer[]);
    } catch (error) {
      console.error('Error in fetchViewers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewerPress = (viewer: Viewer) => {
    if (isStreamer || isModerator) {
      setSelectedViewer(viewer);
      setShowUserActionModal(true);
    }
  };

  const renderBadges = (userId: string) => {
    const badges = [];

    // Moderator badge
    if (moderatorIds.has(userId)) {
      badges.push(
        <View key="mod" style={[styles.badge, { backgroundColor: colors.gradientEnd }]}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="shield"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>MOD</Text>
        </View>
      );
    }

    // Fan club badge
    const fanBadge = fanClubBadges.get(userId);
    if (fanBadge) {
      badges.push(
        <View key="fan" style={[styles.badge, { backgroundColor: fanBadge.color }]}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={10}
            color={colors.text}
          />
          <Text style={styles.badgeText}>{fanBadge.name}</Text>
        </View>
      );
    }

    return badges.length > 0 ? <View style={styles.badgeContainer}>{badges}</View> : null;
  };

  const renderViewer = ({ item }: { item: Viewer }) => (
    <TouchableOpacity
      style={styles.viewerItem}
      onPress={() => handleViewerPress(item)}
      disabled={!isStreamer && !isModerator}
    >
      <View style={styles.avatarContainer}>
        {item.users.avatar_url ? (
          <Image source={{ uri: item.users.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>
      <View style={styles.viewerInfo}>
        <View style={styles.viewerNameRow}>
          <Text style={styles.viewerName}>{item.users.display_name}</Text>
          {renderBadges(item.user_id)}
        </View>
        <Text style={styles.viewerUsername}>@{item.users.username}</Text>
      </View>
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Watching</Text>
      </View>
      {(isStreamer || isModerator) && (
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron_right"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconSymbol
                ios_icon_name="eye.fill"
                android_material_icon_name="visibility"
                size={24}
                color={colors.gradientEnd}
              />
              <Text style={styles.title}>Active Viewers ({viewerCount})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {isLoading && viewers.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gradientEnd} />
              <Text style={styles.loadingText}>Loading viewers...</Text>
            </View>
          ) : viewers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No viewers yet</Text>
              <Text style={styles.emptySubtext}>
                Share your stream to get viewers!
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.updateIndicator}>
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.updateText}>Auto-updating live</Text>
              </View>
              <FlatList
                data={viewers}
                renderItem={renderViewer}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      </View>

      {selectedViewer && (
        <UserActionModal
          visible={showUserActionModal}
          onClose={() => {
            setShowUserActionModal(false);
            setSelectedViewer(null);
          }}
          userId={selectedViewer.user_id}
          username={selectedViewer.users.display_name}
          streamId={streamId}
          streamerId={streamerId}
          currentUserId={currentUserId}
          isStreamer={isStreamer}
          isModerator={isModerator}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(227, 0, 82, 0.1)',
  },
  updateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: {
    padding: 20,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerInfo: {
    flex: 1,
  },
  viewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text,
  },
  viewerUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gradientEnd,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
