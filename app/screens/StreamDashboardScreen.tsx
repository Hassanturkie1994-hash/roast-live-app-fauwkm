
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { moderationService, Moderator, BannedUser } from '@/app/services/moderationService';

export default function StreamDashboardScreen() {
  const { user } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [mods, banned] = await Promise.all([
        moderationService.getModerators(user.id),
        moderationService.getBannedUsers(user.id),
      ]);
      setModerators(mods);
      setBannedUsers(banned);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await moderationService.searchUsersByUsername(searchUsername);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddModerator = async (userId: string, username: string) => {
    if (!user) return;

    // Check if already a moderator
    if (moderators.some((mod) => mod.user_id === userId)) {
      Alert.alert('Already a Moderator', `${username} is already a moderator.`);
      return;
    }

    // Check limit
    if (moderators.length >= 30) {
      Alert.alert('Limit Reached', 'You can have a maximum of 30 moderators.');
      return;
    }

    const result = await moderationService.addModerator(user.id, userId);
    if (result.success) {
      Alert.alert('Success', `${username} has been added as a moderator.`);
      setSearchUsername('');
      setSearchResults([]);
      fetchData();
    } else {
      Alert.alert('Error', result.error || 'Failed to add moderator.');
    }
  };

  const handleRemoveModerator = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${username} as a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await moderationService.removeModerator(user.id, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been removed as a moderator.`);
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove moderator.');
            }
          },
        },
      ]
    );
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!user) return;

    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            const result = await moderationService.unbanUser(user.id, userId);
            if (result.success) {
              Alert.alert('Success', `${username} has been unbanned.`);
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to unban user.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stream Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stream Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/PerformanceGrowthScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="chart.bar.xaxis"
                android_material_icon_name="bar_chart"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/FanClubManagementScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="heart.circle.fill"
                android_material_icon_name="favorite"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Fan Club</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/screens/BlockedUsersScreen' as any)}
            >
              <IconSymbol
                ios_icon_name="hand.raised.circle.fill"
                android_material_icon_name="block"
                size={32}
                color={colors.gradientEnd}
              />
              <Text style={styles.quickActionText}>Blocked Users</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Moderator Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={20}
              color={colors.gradientEnd}
            />
            {' '}Add Moderator
          </Text>
          <Text style={styles.sectionSubtitle}>
            Search by username to add a moderator ({moderators.length}/30)
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search username..."
              placeholderTextColor={colors.placeholder}
              value={searchUsername}
              onChangeText={setSearchUsername}
              onSubmitEditing={handleSearchUsers}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchUsers}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResultItem}
                  onPress={() => handleAddModerator(result.id, result.username)}
                >
                  {result.avatar_url ? (
                    <Image source={{ uri: result.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{result.display_name}</Text>
                    <Text style={styles.searchResultUsername}>@{result.username}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add_circle"
                    size={24}
                    color={colors.gradientEnd}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current Moderators Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={20}
              color={colors.text}
            />
            {' '}Current Moderators ({moderators.length})
          </Text>

          {moderators.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No moderators yet</Text>
              <Text style={styles.emptySubtext}>
                Add moderators to help manage your streams
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {moderators.map((mod) => (
                <View key={mod.id} style={styles.listItem}>
                  {mod.profiles?.avatar_url ? (
                    <Image source={{ uri: mod.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{mod.profiles?.display_name}</Text>
                    <Text style={styles.listItemUsername}>@{mod.profiles?.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveModerator(mod.user_id, mod.profiles?.username || 'User')
                    }
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.gradientEnd}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Banned Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={20}
              color={colors.gradientEnd}
            />
            {' '}Banned Users ({bannedUsers.length})
          </Text>

          {bannedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={48}
                color="#4CAF50"
              />
              <Text style={styles.emptyText}>No banned users</Text>
              <Text style={styles.emptySubtext}>
                Users you ban will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {bannedUsers.map((banned) => (
                <View key={banned.id} style={styles.listItem}>
                  {banned.profiles?.avatar_url ? (
                    <Image source={{ uri: banned.profiles.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{banned.profiles?.display_name}</Text>
                    <Text style={styles.listItemUsername}>@{banned.profiles?.username}</Text>
                    {banned.reason && (
                      <Text style={styles.banReason}>Reason: {banned.reason}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.unbanButton}
                    onPress={() =>
                      handleUnbanUser(banned.user_id, banned.profiles?.username || 'User')
                    }
                  >
                    <Text style={styles.unbanButtonText}>Unban</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: colors.gradientEnd,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  listItemUsername: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  banReason: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  unbanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unbanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionButton: {
    width: '30%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
