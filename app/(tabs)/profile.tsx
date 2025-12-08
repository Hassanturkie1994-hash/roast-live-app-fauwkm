
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import RoastLiveLogo from '@/components/RoastLiveLogo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Tables } from '@/app/integrations/supabase/types';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

type Stream = Tables<'streams'>;

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    } else {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.display_name);
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const [streamsData, followersData, followingData] = await Promise.all([
        supabase
          .from('streams')
          .select('*')
          .eq('broadcaster_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ]);

      if (streamsData.data) setStreams(streamsData.data);
      if (followersData.count !== null) setFollowersCount(followersData.count);
      if (followingData.count !== null) setFollowingCount(followingData.count);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: editDisplayName,
          bio: editBio,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      await refreshProfile();
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error in handleSaveProfile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleStreamPress = (stream: Stream) => {
    if (stream.status === 'live') {
      router.push({
        pathname: '/live-player',
        params: { streamId: stream.id },
      });
    }
  };

  if (!profile) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoHeader}>
          <RoastLiveLogo size="small" />
        </View>

        <View style={styles.header}>
          <Image
            source={{
              uri: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.verified_status && (
            <View style={styles.verifiedBadge}>
              <IconSymbol
                ios_icon_name="checkmark.seal.fill"
                android_material_icon_name="verified"
                size={20}
                color={colors.gradientEnd}
              />
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{streams.length}</Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
          </View>

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.buttonRow}>
            <View style={styles.buttonFlex}>
              <GradientButton title="Edit Profile" onPress={handleEditProfile} size="medium" />
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleSignOut}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tab, styles.tabActive]}>
            <IconSymbol
              ios_icon_name="play.rectangle.fill"
              android_material_icon_name="play_arrow"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.tabText, styles.tabTextActive]}>Streams</Text>
          </View>
        </View>

        <View style={styles.streamsGrid}>
          {streams.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="video.slash"
                android_material_icon_name="videocam_off"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No streams yet</Text>
              <Text style={styles.emptySubtext}>Start your first live stream!</Text>
            </View>
          ) : (
            streams.map((stream, index) => (
              <TouchableOpacity
                key={index}
                style={styles.streamCard}
                onPress={() => handleStreamPress(stream)}
                activeOpacity={0.8}
              >
                <View style={styles.streamThumbnail}>
                  <IconSymbol
                    ios_icon_name="play.fill"
                    android_material_icon_name="play_arrow"
                    size={32}
                    color={colors.text}
                  />
                </View>
                <View style={styles.streamOverlay}>
                  {stream.status === 'live' && (
                    <View style={styles.liveBadgeSmall}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                  <View style={styles.streamInfo}>
                    <Text style={styles.streamTitle} numberOfLines={2}>
                      {stream.title}
                    </Text>
                    <View style={styles.streamStats}>
                      <IconSymbol
                        ios_icon_name="eye.fill"
                        android_material_icon_name="visibility"
                        size={12}
                        color={colors.text}
                      />
                      <Text style={styles.streamViewers}>{stream.viewer_count || 0}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your display name"
                placeholderTextColor={colors.placeholder}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.placeholder}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.saveButtonContainer}>
                <GradientButton title="SAVE" onPress={handleSaveProfile} size="medium" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  logoHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundAlt,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.border,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  verifiedBadge: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  streamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 2,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
  },
  streamCard: {
    width: (screenWidth - 36) / 3,
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
    position: 'relative',
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'space-between',
  },
  liveBadgeSmall: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gradientEnd,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  streamInfo: {
    gap: 4,
  },
  streamTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 16,
  },
  streamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streamViewers: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  saveButtonContainer: {
    flex: 1,
  },
});
