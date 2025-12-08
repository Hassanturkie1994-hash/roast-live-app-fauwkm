
import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import ProfileHeader from '@/components/ProfileHeader';
import StreamPreviewCard, { StreamData } from '@/components/StreamPreviewCard';
import { IconSymbol } from '@/components/IconSymbol';

const mockUserProfile = {
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  name: 'John Doe',
  username: 'johndoe',
  followersCount: 15000,
  followingCount: 250,
};

const mockPastStreams: StreamData[] = [
  {
    id: '1',
    title: 'My Last Epic Stream',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    creatorName: 'John Doe',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    viewerCount: 8500,
    isLive: false,
  },
  {
    id: '2',
    title: 'Gaming Marathon Stream',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    creatorName: 'John Doe',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    viewerCount: 6200,
    isLive: false,
  },
];

export default function ProfileScreen() {
  const [isFollowing, setIsFollowing] = React.useState(false);

  const handleFollowPress = () => {
    setIsFollowing(!isFollowing);
    console.log('Follow button pressed');
  };

  const handleStreamPress = (streamId: string) => {
    console.log('Past stream pressed:', streamId);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          avatar={mockUserProfile.avatar}
          name={mockUserProfile.name}
          username={mockUserProfile.username}
          followersCount={mockUserProfile.followersCount}
          followingCount={mockUserProfile.followingCount}
          isFollowing={isFollowing}
          onFollowPress={handleFollowPress}
          isOwnProfile={true}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="history"
              size={20}
              color={colors.text}
            />
            <Text style={styles.sectionTitle}>Past Streams</Text>
          </View>

          {mockPastStreams.map((stream, index) => (
            <React.Fragment key={index}>
              <StreamPreviewCard
                stream={stream}
                onPress={() => handleStreamPress(stream.id)}
              />
            </React.Fragment>
          ))}
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingsButton}>
            <IconSymbol
              ios_icon_name="gear"
              android_material_icon_name="settings"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
