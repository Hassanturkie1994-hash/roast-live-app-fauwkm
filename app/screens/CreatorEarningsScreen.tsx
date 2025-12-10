
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { creatorRevenueService } from '@/app/services/creatorRevenueService';
import { payoutService, PayoutRequest } from '@/app/services/payoutService';
import { walletService } from '@/app/services/walletService';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreatorEarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Revenue stats
  const [totalEarned, setTotalEarned] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [giftsEarnings, setGiftsEarnings] = useState(0);
  const [subscriptionEarnings, setSubscriptionEarnings] = useState(0);

  // Payout requests
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

  // Form state
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [iban, setIban] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      setLoading(true);

      // Get revenue stats
      const revenueStats = await creatorRevenueService.getRevenueStats(user.id);
      setTotalEarned(revenueStats.totalEarned);
      setGiftsEarnings(revenueStats.totalFromGifts);
      setSubscriptionEarnings(revenueStats.totalFromSubscriptions);

      // Get wallet balance
      const wallet = await walletService.getOrCreateWallet(user.id);
      setWithdrawableBalance(wallet ? wallet.balance_cents / 100 : 0);

      // Get payout requests
      const requests = await payoutService.getUserPayoutRequests(user.id);
      setPayoutRequests(requests);

      // Calculate pending payouts
      const pending = requests
        .filter((r) => r.status === 'pending' || r.status === 'processing')
        .reduce((sum, r) => sum + r.amount_cents / 100, 0);
      setPendingPayouts(pending);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRequestPayout = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    if (!fullName || !country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!iban && !bankAccount) {
      Alert.alert('Error', 'Please provide either IBAN or Bank Account');
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > withdrawableBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (amount < 100) {
      Alert.alert('Error', 'Minimum payout amount is 100 SEK');
      return;
    }

    try {
      setSubmitting(true);

      const result = await payoutService.createPayoutRequest(
        user.id,
        Math.round(amount * 100), // Convert to cents
        fullName,
        country,
        iban,
        bankAccount
      );

      if (result.success) {
        Alert.alert('Success', 'Payout request submitted successfully');
        setShowPayoutForm(false);
        setFullName('');
        setCountry('');
        setIban('');
        setBankAccount('');
        setPayoutAmount('');
        await loadData();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#2196F3';
      case 'paid':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#A40028" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A40028" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Creator Earnings</Text>
      </View>

      {/* Revenue Summary Cards */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#A40028', '#E30052']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>Total Earned (Lifetime)</Text>
          <Text style={styles.summaryValue}>{totalEarned.toFixed(2)} SEK</Text>
        </LinearGradient>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>Withdrawable Balance</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {withdrawableBalance.toFixed(2)} SEK
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>Pending Payouts</Text>
          <Text style={[styles.summaryValue, { color: '#FFA500' }]}>
            {pendingPayouts.toFixed(2)} SEK
          </Text>
        </View>
      </View>

      {/* Earnings Breakdown */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Gifts Earnings
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            {giftsEarnings.toFixed(2)} SEK
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Subscription Earnings
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            {subscriptionEarnings.toFixed(2)} SEK
          </Text>
        </View>
      </View>

      {/* Request Payout Button */}
      {!showPayoutForm && (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => setShowPayoutForm(true)}
          disabled={withdrawableBalance < 100}
        >
          <LinearGradient
            colors={withdrawableBalance >= 100 ? ['#A40028', '#E30052'] : ['#666', '#888']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.requestButtonGradient}
          >
            <Text style={styles.requestButtonText}>Request Payout</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Payout Request Form */}
      {showPayoutForm && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Request Payout</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Full Name"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            value={country}
            onChangeText={setCountry}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="IBAN (optional)"
            placeholderTextColor={colors.textSecondary}
            value={iban}
            onChangeText={setIban}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Bank Account (optional)"
            placeholderTextColor={colors.textSecondary}
            value={bankAccount}
            onChangeText={setBankAccount}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Amount (SEK)"
            placeholderTextColor={colors.textSecondary}
            value={payoutAmount}
            onChangeText={setPayoutAmount}
            keyboardType="numeric"
          />

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Minimum payout: 100 SEK
          </Text>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: colors.background }]}
              onPress={() => setShowPayoutForm(false)}
            >
              <Text style={[styles.formButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formButton}
              onPress={handleRequestPayout}
              disabled={submitting}
            >
              <LinearGradient
                colors={['#A40028', '#E30052']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.formButtonGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.formButtonText}>Submit Request</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payout Requests History */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payout Requests</Text>
        {payoutRequests.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No payout requests yet
          </Text>
        ) : (
          payoutRequests.map((request) => (
            <View key={request.id} style={[styles.requestItem, { borderColor: colors.border }]}>
              <View style={styles.requestHeader}>
                <Text style={[styles.requestAmount, { color: colors.text }]}>
                  {(request.amount_cents / 100).toFixed(2)} SEK
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
                {new Date(request.created_at).toLocaleDateString()}
              </Text>
              {request.notes && (
                <Text style={[styles.requestNotes, { color: colors.textSecondary }]}>
                  Note: {request.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownLabel: {
    fontSize: 16,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  requestButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 15,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  formButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  formButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  requestItem: {
    borderBottomWidth: 1,
    paddingVertical: 15,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  requestAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDate: {
    fontSize: 14,
    marginBottom: 5,
  },
  requestNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
