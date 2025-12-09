
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  payment_method?: string;
  source?: string;
  status: string;
  created_at: string;
}

export default function WalletScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [walletData, transactionsData] = await Promise.all([
        supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (walletData.data) {
        setWalletBalance(parseFloat(walletData.data.balance));
      }

      if (transactionsData.data) {
        setTransactions(transactionsData.data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBalance = () => {
    router.push('/screens/AddBalanceScreen');
  };

  const handleViewAllTransactions = () => {
    router.push('/screens/TransactionHistoryScreen');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add_balance':
      case 'wallet_topup':
        return { ios: 'plus.circle.fill', android: 'add_circle', color: colors.gradientEnd };
      case 'withdraw':
      case 'withdrawal':
        return { ios: 'arrow.down.circle.fill', android: 'download', color: colors.text };
      case 'gift_purchase':
        return { ios: 'gift.fill', android: 'card_giftcard', color: colors.gradientStart };
      case 'creator_tip':
        return { ios: 'heart.fill', android: 'favorite', color: colors.gradientEnd };
      default:
        return { ios: 'circle.fill', android: 'circle', color: colors.text };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
        <Text style={styles.headerTitle}>Saldo</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{walletBalance.toFixed(2)} SEK</Text>
            <View style={styles.balanceActions}>
              <GradientButton
                title="Add Balance"
                onPress={handleAddBalance}
                size="medium"
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.length > 5 && (
                <TouchableOpacity onPress={handleViewAllTransactions}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="tray"
                  android_material_icon_name="inbox"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Add balance to start using gifts and features
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction, index) => {
                  const icon = getTransactionIcon(transaction.type);
                  return (
                    <View key={index} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                          <IconSymbol
                            ios_icon_name={icon.ios}
                            android_material_icon_name={icon.android}
                            size={20}
                            color={icon.color}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionType}>{formatType(transaction.type)}</Text>
                          <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            transaction.amount < 0 && styles.negativeAmount,
                          ]}
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} SEK
                        </Text>
                        <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.gradientEnd}
            />
            <Text style={styles.infoText}>
              Your Saldo balance can be used to purchase gifts during live streams and support your favorite creators.
            </Text>
          </View>
        </ScrollView>
      )}
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
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  balanceActions: {
    width: '100%',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gradientEnd,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  negativeAmount: {
    color: colors.text,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
