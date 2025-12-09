
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function AccountSettingsScreen() {
  const { signOut } = useAuth();
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [commentPermission, setCommentPermission] = useState<'everyone' | 'followers' | 'no_one'>('everyone');

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

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This feature will be available soon.');
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ALLMÄNT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALLMÄNT</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/screens/EditProfileScreen')}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Profile Settings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/screens/WalletScreen')}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.settingText}>Saldo</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/screens/GiftInformationScreen')}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="gift.fill"
                android_material_icon_name="card_giftcard"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.settingText}>Gift Information</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Saved Streams', 'This feature will be available soon.')}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="bookmark.fill"
                android_material_icon_name="bookmark"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Saved Streams</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/screens/StreamDashboardScreen')}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.settingText}>Stream Dashboard</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Security</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleEnable2FA}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="security"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Enable 2FA</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={[styles.settingText, styles.dangerText]}>Logout</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="eye.slash.fill"
                android_material_icon_name="visibility_off"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Private Profile</Text>
            </View>
            <Switch
              value={isPrivateProfile}
              onValueChange={setIsPrivateProfile}
              trackColor={{ false: colors.border, true: colors.gradientEnd }}
              thumbColor={colors.text}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="bubble.left.fill"
                android_material_icon_name="comment"
                size={20}
                color={colors.text}
              />
              <View>
                <Text style={styles.settingText}>Who Can Comment</Text>
                <Text style={styles.settingSubtext}>{commentPermission}</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payments & Payouts</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleAddCredits}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add_circle"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.settingText}>Add Credits</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleWithdrawEarnings}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="download"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Withdraw Earnings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTransactionHistory}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="list.bullet"
                android_material_icon_name="history"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Transaction History</Text>
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
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    color: colors.text,
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dangerText: {
    color: colors.gradientEnd,
  },
});
