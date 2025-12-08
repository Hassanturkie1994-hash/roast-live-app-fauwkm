
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';

const { width: screenWidth } = Dimensions.get('window');

interface StreamClip {
  id: string;
  thumbnail: string;
  views: number;
  duration: string;
}

const mockUserProfile = {
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  name: 'John Doe',
  username: 'johndoe',
  bio: 'Live streamer | Gamer | Content Creator 🎮',
  link: 'roastlive.com/johndoe',
  followersCount: 15000,
  followingCount: 250,
  likesCount: 125400,
};

const mockClips: StreamClip[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    views: 8500,
    duration: '12:34',
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    views: 6200,
    duration: '08:15',
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    views: 4800,
    duration: '15:42',
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    views: 3200,
    duration: '10:20',
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    views: 2100,
    duration: '06:45',
  },
  {
    id: '6',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    views: 1800,
    duration: '09:30',
  },
];

type TabType = 'streams' | 'likes';

export default function ProfileScreen() {
  const [isOwnProfile] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>('streams');

  const handleEditProfile = () => {
    console.log('Edit profile pressed');
  };

  const handleClipPress = (clipId: string) => {
    console.log('Clip pressed:', clipId);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={{ uri: mockUserProfile.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{mockUserProfile.name}</Text>
          <Text style={styles.username}>@{mockUserProfile.username}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(mockUserProfile.followersCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(mockUserProfile.followingCount)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCount(mockUserProfile.likesCount)}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {mockUserProfile.bio && (
            <Text style={styles.bio}>{mockUserProfile.bio}</Text>
          )}

          {mockUserProfile.link && (
            <TouchableOpacity style={styles.linkContainer}>
              <IconSymbol
                ios_icon_name="link"
                android_material_icon_name="link"
                size={16}
                color={colors.gradientEnd}
              />
              <Text style={styles.link}>{mockUserProfile.link}</Text>
            </TouchableOpacity>
          )}

          {isOwnProfile ? (
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <GradientButton
                  title="Edit Profile"
                  onPress={handleEditProfile}
                  size="medium"
                />
              </View>
              <TouchableOpacity style={styles.iconButton}>
                <IconSymbol
                  ios_icon_name="gear"
                  android_material_icon_name="settings"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <GradientButton title="Follow" onPress={() => {}} size="medium" />
              </View>
              <TouchableOpacity style={styles.iconButton}>
                <IconSymbol
                  ios_icon_name="ellipsis"
                  android_material_icon_name="more_horiz"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'streams' && styles.tabActive]}
            onPress={() => setSelectedTab('streams')}
          >
            <IconSymbol
              ios_icon_name="play.rectangle.fill"
              android_material_icon_name="play_arrow"
              size={20}
              color={selectedTab === 'streams' ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'streams' && styles.tabTextActive,
              ]}
            >
              Streams
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'likes' && styles.tabActive]}
            onPress={() => setSelectedTab('likes')}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={20}
              color={selectedTab === 'likes' ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'likes' && styles.tabTextActive,
              ]}
            >
              Likes
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.clipsGrid}>
          {mockClips.map((clip, index) => (
            <TouchableOpacity
              key={index}
              style={styles.clipCard}
              onPress={() => handleClipPress(clip.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: clip.thumbnail }} style={styles.clipThumbnail} />
              <View style={styles.clipOverlay}>
                <View style={styles.clipDuration}>
                  <Text style={styles.clipDurationText}>{clip.duration}</Text>
                </View>
                <View style={styles.clipViews}>
                  <IconSymbol
                    ios_icon_name="eye.fill"
                    android_material_icon_name="visibility"
                    size={12}
                    color={colors.text}
                  />
                  <Text style={styles.clipViewsText}>{formatCount(clip.views)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
  username: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
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
    marginBottom: 12,
    lineHeight: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gradientEnd,
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
  clipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 2,
  },
  clipCard: {
    width: (screenWidth - 36) / 3,
    aspectRatio: 9 / 16,
    backgroundColor: colors.card,
    position: 'relative',
  },
  clipThumbnail: {
    width: '100%',
    height: '100%',
  },
  clipOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'space-between',
  },
  clipDuration: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clipDurationText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  clipViews: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  clipViewsText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
});
