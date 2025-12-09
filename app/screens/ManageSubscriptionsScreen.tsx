
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { creatorClubService, CreatorClubMembership } from '@/app/services/creatorClubService';
import { walletService, WalletTransactionV2 } from '@/app/services/walletService';

export default function ManageSubscriptionsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<CreatorClubMembership[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionV2[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load memberships
      const membershipData = await creatorClubService.getUserMemberships(user.id);
      setMemberships(membershipData);

      // Load subscription payment transactions
      const allTransactions = await walletService.getTransactions(user.id, 100);
      const subscriptionTransactions = allTransactions.filter(
        (t) => t.type === 'subscription_payment' && t.amount_cents < 0
      );
      setTransactions(subscriptionTransactions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = (membership: CreatorClubMembership) => {
    if (!membership.creator_clubs) return;

    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your subscription to ${membership.creator_clubs.name}? Your benefits will remain active until ${new Date(membership.renews_at).toLocaleDateString()}.`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            const result = await creatorClubService.cancelMembership(
              membership.club_id,
              membership.member_id,
              false
            );

            if (result.success) {
              Alert.alert('Success', 'Your subscription has been canceled');
              loadData();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel subscription');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Subscriptions</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Subscriptions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Subscriptions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Subscriptions ({memberships.length})
          </Text>

          {memberships.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="star.slash"
                android_material_icon_name="star_border"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No active subscriptions
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Join a creator&apos;s VIP club to get exclusive benefits
              </Text>
            </View>
          ) : (
            <View style={styles.membershipsList}>
              {memberships.map((membership) => (
                <View
                  key={membership.id}
                  style={[
                    styles.membershipCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.membershipHeader}>
                    <View style={styles.membershipInfo}>
                      <Text style={[styles.clubName, { color: colors.text }]}>
                        {membership.creator_clubs?.name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                        <Text style={styles.badgeText}>{membership.creator_clubs?.tag}</Text>
                      </View>
                    </View>
                    {membership.cancel_at_period_end && (
                      <View style={[styles.cancelingBadge, { backgroundColor: colors.brandPrimary + '20' }]}>
                        <Text style={[styles.cancelingText, { color: colors.brandPrimary }]}>
                          Canceling
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.membershipDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="calendar_today"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Renews: {new Date(membership.renews_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="dollarsign.circle"
                        android_material_icon_name="attach_money"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        kr {((membership.creator_clubs?.monthly_price_cents || 0) / 100).toFixed(2)}/month
                      </Text>
                    </View>
                  </View>

                  {!membership.cancel_at_period_end && (
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: colors.brandPrimary }]}
                      onPress={() => handleCancelSubscription(membership)}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.brandPrimary }]}>
                        Cancel Subscription
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment History</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>No payment history</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.transactionIcon}>
                    <IconSymbol
                      ios_icon_name="arrow.up.circle.fill"
                      android_material_icon_name="arrow_upward"
                      size={24}
                      color={colors.brandPrimary}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]}>
                      Subscription Payment
                    </Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: colors.brandPrimary }]}>
                    -kr {(Math.abs(transaction.amount_cents) / 100).toFixed(2)}
                  </Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
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
  membershipsList: {
    gap: 12,
  },
  membershipCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cancelingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  membershipDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
  },
  cancelButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
