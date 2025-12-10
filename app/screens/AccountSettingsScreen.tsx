
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/app/integrations/supabase/client';
import { adminService, AdminRole } from '@/app/services/adminService';

export default function AccountSettingsScreen() {
  const { signOut, user, profile } = useAuth();
  const { colors } = useTheme();
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [commentPermission, setCommentPermission] = useState<'everyone' | 'followers' | 'no_one'>('everyone');
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    checkUserRole();
    checkIfLive();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      setIsLoadingRole(false);
      return;
    }

    const result = await adminService.checkAdminRole(user.id);
    setUserRole(result.role);
    setIsLoadingRole(false);
  };

  const checkIfLive = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('streams')
        .select('id, status')
        .eq('broadcaster_id', user.id)
        .eq('status', 'live')
        .maybeSingle();

      setIsLive(!!data);
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  };

  const handleSignOut = async () => {
    if (isLive) {
      Alert.alert(
        'Cannot Logout',
        'You must end your live session before logging out.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  const handleChangePassword = () => {
    router.push('/screens/ChangePasswordScreen');
  };

  const handleDashboard = () => {
    if (userRole === 'HEAD_ADMIN') {
      router.push('/screens/HeadAdminDashboardScreen' as any);
    } else if (userRole === 'ADMIN') {
      router.push('/screens/AdminDashboardScreen' as any);
    } else if (userRole === 'SUPPORT') {
      router.push('/screens/SupportDashboardScreen' as any);
    } else if (userRole === 'MODERATOR') {
      router.push('/screens/ModeratorDashboardScreen' as any);
    }
  };

  const handleEnable2FA = () => {
    Alert.alert('Two-Factor Authentication', 'This feature will be available soon.');
  };

  const handleAddCredits = () => {
    Alert.alert('Add Credits', 'Payment integration coming soon.');
  };

  const handleWithdrawEarnings = () => {
    router.push('/screens/WithdrawScreen');
  };

  const handleTransactionHistory = () => {
    router.push('/screens/TransactionHistoryScreen');
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard & Tools Section - Role-Based */}
        {!isLoadingRole && userRole && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎛️ Dashboard & Tools</Text>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
              onPress={handleDashboard}
            >
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name="dashboard"
                  size={20}
                  color={colors.brandPrimary}
                />
                <View>
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    {userRole === 'HEAD_ADMIN' && 'Head Admin Dashboard'}
                    {userRole === 'ADMIN' && 'Admin Dashboard'}
                    {userRole === 'SUPPORT' && 'Support Dashboard'}
                    {userRole === 'MODERATOR' && 'Moderator Dashboard'}
                  </Text>
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    {userRole === 'HEAD_ADMIN' && 'Full platform control'}
                    {userRole === 'ADMIN' && 'Manage reports & users'}
                    {userRole === 'SUPPORT' && 'Review appeals & tickets'}
                    {userRole === 'MODERATOR' && 'Stream moderation tools'}
                  </Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ALLMÄNT Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ALLMÄNT</Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AppearanceSettingsScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="paintbrush.fill"
                android_material_icon_name="palette"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Appearance</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/EditProfileScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Profile Settings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/WalletScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Saldo</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/GiftInformationScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Gift Information</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/SavedStreamsScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="bookmark.fill"
                android_material_icon_name="bookmark"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Saved Streams</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AchievementsScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color="#FFD700"
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Achievements</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/VIPClubDashboardScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace_premium"
                size={20}
                color="#FFD700"
              />
              <Text style={[styles.settingText, { color: colors.text }]}>VIP Members</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/ManageSubscriptionsScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="credit_card"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Manage Subscriptions</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/StreamDashboardScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Stream Dashboard</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/BlockedUsersScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="block"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Blocked Users</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Security</Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AccountSecurityScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="security"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Account Security</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleChangePassword}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/AppealsViolationsScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Appeals & Violations</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleSignOut}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={20}
                color={colors.brandPrimary}
              />
              <View>
                <Text style={[styles.settingText, styles.dangerText, { color: colors.brandPrimary }]}>Logout</Text>
                {isLive && (
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    End live session first
                  </Text>
                )}
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📄 Legal & Privacy</Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/TermsOfServiceScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={() => router.push('/screens/PrivacyPolicyScreen')}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="privacy_tip"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Preferences Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Profile Preferences</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="eye.slash.fill"
                android_material_icon_name="visibility_off"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Private Profile</Text>
            </View>
            <Switch
              value={isPrivateProfile}
              onValueChange={setIsPrivateProfile}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="bubble.left.fill"
                android_material_icon_name="comment"
                size={20}
                color={colors.text}
              />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>Who Can Comment</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>{commentPermission}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Who Can Comment', 'Choose who can comment on your posts', [
                  { text: 'Everyone', onPress: () => setCommentPermission('everyone') },
                  { text: 'Followers', onPress: () => setCommentPermission('followers') },
                  { text: 'No One', onPress: () => setCommentPermission('no_one') },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payments & Payouts Section */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💳 Payments & Payouts</Text>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleAddCredits}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add_circle"
                size={20}
                color={colors.brandPrimary}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Add Credits</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleWithdrawEarnings}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="download"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Withdraw Earnings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.divider }]} 
            onPress={handleTransactionHistory}
          >
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="list.bullet"
                android_material_icon_name="history"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.settingText, { color: colors.text }]}>Transaction History</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dangerText: {
    // Color will be set dynamically
  },
});
