
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import BadgeEditorModal from '@/components/BadgeEditorModal';
import GradientButton from '@/components/GradientButton';

const BADGE_COLORS = [
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#9370DB', // Medium Purple
  '#00CED1', // Dark Turquoise
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#FF6347', // Tomato
];

interface VIPMember {
  id: string;
  subscriber_id: string;
  activated_at: string;
  expires_at: string;
  badge_text: string;
  is_active: boolean;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Moderator {
  id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function VIPClubDashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vipMembers, setVipMembers] = useState<VIPMember[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [badgeName, setBadgeName] = useState('VIP');
  const [badgeColor, setBadgeColor] = useState(BADGE_COLORS[0]);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch VIP members
      const { data: membersData } = await supabase
        .from('vip_memberships')
        .select(`
          *,
          profiles:subscriber_id(username, display_name, avatar_url)
        `)
        .eq('vip_owner_id', user.id)
        .order('activated_at', { ascending: false });

      if (membersData) {
        setVipMembers(membersData);
        
        // Calculate revenue (assuming $3 per member per month, 70% goes to creator)
        const activeMembers = membersData.filter((m: VIPMember) => m.is_active).length;
        const monthlyEarnings = activeMembers * 3 * 0.7; // $2.10 per member
        setMonthlyRevenue(monthlyEarnings);
        
        // Calculate total revenue (simplified - would need transaction history for accuracy)
        setTotalRevenue(monthlyEarnings * 3); // Estimate based on 3 months average
      }

      // Fetch moderators
      const { data: modsData } = await supabase
        .from('moderators')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('streamer_id', user.id)
        .order('created_at', { ascending: false });

      if (modsData) {
        setModerators(modsData);
      }

      // Fetch fan club settings
      const { data: fanClubData } = await supabase
        .from('fan_clubs')
        .select('club_name, badge_color')
        .eq('streamer_id', user.id)
        .single();

      if (fanClubData) {
        setBadgeName(fanClubData.club_name);
        setBadgeColor(fanClubData.badge_color);
      }
    } catch (error) {
      console.error('Error fetching VIP dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    Alert.alert(
      'Remove VIP Member',
      `Are you sure you want to remove ${username} from your VIP club?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('vip_memberships')
              .update({ is_active: false })
              .eq('id', memberId);

            if (error) {
              Alert.alert('Error', 'Failed to remove member');
            } else {
              Alert.alert('Success', `${username} has been removed from your VIP club`);
              fetchData();
            }
          },
        },
      ]
    );
  };

  const handleRemoveModerator = async (modId: string, username: string) => {
    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${username} as a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('moderators')
              .delete()
              .eq('id', modId);

            if (error) {
              Alert.alert('Error', 'Failed to remove moderator');
            } else {
              Alert.alert('Success', `${username} is no longer a moderator`);
              fetchData();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>VIP Club Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </View>
    );
  }

  const activeMembers = vipMembers.filter(m => m.is_active);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>VIP Club Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* VIP Banner */}
      <View style={[styles.vipBanner, { backgroundColor: `${colors.brandPrimary}20`, borderBottomColor: colors.brandPrimary }]}>
        <IconSymbol
          ios_icon_name="star.fill"
          android_material_icon_name="star"
          size={24}
          color={colors.brandPrimary}
        />
        <Text style={[styles.vipBannerText, { color: colors.brandPrimary }]}>CREATOR DASHBOARD</Text>
        <IconSymbol
          ios_icon_name="star.fill"
          android_material_icon_name="star"
          size={24}
          color={colors.brandPrimary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Summary */}
        <View style={styles.revenueSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Overview</Text>
          <View style={styles.revenueCards}>
            <View style={[styles.revenueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="attach_money"
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Monthly</Text>
              <Text style={[styles.revenueValue, { color: colors.text }]}>${monthlyRevenue.toFixed(2)}</Text>
            </View>
            <View style={[styles.revenueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={24}
                color={colors.brandPrimary}
              />
              <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.revenueValue, { color: colors.text }]}>${totalRevenue.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Badge Designer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>VIP Badge</Text>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.brandPrimary }]}
              onPress={() => setShowBadgeEditor(true)}
            >
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.badgePreviewContainer, { backgroundColor: colors.backgroundAlt }]}>
            <Text style={[styles.badgePreviewLabel, { color: colors.textSecondary }]}>Current Badge</Text>
            <View style={[styles.badgePreview, { backgroundColor: badgeColor }]}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.badgePreviewText}>{badgeName}</Text>
            </View>
          </View>
        </View>

        {/* VIP Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              VIP Members ({activeMembers.length})
            </Text>
          </View>

          {activeMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="person.2.slash"
                android_material_icon_name="people_outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No VIP members yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Members will appear here when they subscribe
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {activeMembers.map((member) => (
                <View key={member.id} style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {member.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: member.profiles.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {member.profiles?.display_name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.badgeText}>{badgeName}</Text>
                      </View>
                    </View>
                    <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>
                      @{member.profiles?.username}
                    </Text>
                    <Text style={[styles.memberDate, { color: colors.textSecondary }]}>
                      Member since {new Date(member.activated_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveMember(
                        member.id,
                        member.profiles?.username || 'User'
                      )
                    }
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.brandPrimary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Moderators */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Moderators ({moderators.length})
            </Text>
          </View>

          {moderators.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="shield.slash"
                android_material_icon_name="shield"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No moderators assigned</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Assign moderators to help manage your streams
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {moderators.map((mod) => (
                <View key={mod.id} style={[styles.memberItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {mod.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: mod.profiles.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {mod.profiles?.display_name}
                      </Text>
                      <View style={[styles.modBadge, { backgroundColor: colors.brandPrimary }]}>
                        <IconSymbol
                          ios_icon_name="shield.fill"
                          android_material_icon_name="shield"
                          size={12}
                          color="#FFFFFF"
                        />
                        <Text style={styles.modBadgeText}>MOD</Text>
                      </View>
                    </View>
                    <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>
                      @{mod.profiles?.username}
                    </Text>
                    <Text style={[styles.memberDate, { color: colors.textSecondary }]}>
                      Added {new Date(mod.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveModerator(
                        mod.id,
                        mod.profiles?.username || 'User'
                      )
                    }
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.brandPrimary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundAlt }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.brandPrimary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            VIP subscriptions are $3/month. You earn 70% ($2.10) per member. Moderators can help manage your streams globally.
          </Text>
        </View>
      </ScrollView>

      {/* Badge Editor Modal */}
      {user && (
        <BadgeEditorModal
          visible={showBadgeEditor}
          onClose={() => setShowBadgeEditor(false)}
          userId={user.id}
          currentBadgeName={badgeName}
          currentBadgeColor={badgeColor}
          onUpdate={fetchData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderBottomWidth: 2,
    paddingVertical: 12,
  },
  vipBannerText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  revenueSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  revenueCards: {
    flexDirection: 'row',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgePreviewContainer: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  badgePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePreviewText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberUsername: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeButton: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 32,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});
