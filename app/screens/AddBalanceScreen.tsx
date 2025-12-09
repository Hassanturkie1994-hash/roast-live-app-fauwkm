
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function AddBalanceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | null>(null);

  const quickAmounts = [50, 100, 250, 500, 1000];

  const handleAddBalance = async () => {
    if (!user) return;

    const addAmount = parseFloat(amount);

    if (isNaN(addAmount) || addAmount < 1 || addAmount > 1000) {
      Alert.alert('Error', 'Please enter an amount between 1 and 1000 SEK');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      // In a real app, you would integrate with Stripe/PayPal here
      // For now, we'll simulate a successful payment
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        Alert.alert('Error', 'Failed to fetch wallet balance');
        setLoading(false);
        return;
      }

      const currentBalance = parseFloat(walletData.balance);

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallet')
        .update({
          balance: currentBalance + addAmount,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        Alert.alert('Error', 'Failed to update wallet balance');
        setLoading(false);
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: addAmount,
        type: 'wallet_topup',
        payment_method: selectedMethod,
        source: 'wallet_topup',
        status: 'paid',
      });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      Alert.alert('Success', `${addAmount} SEK added to your wallet!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error in handleAddBalance:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Add Balance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (SEK)</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount (1-1000)"
                placeholderTextColor={colors.placeholder}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currencyText}>SEK</Text>
            </View>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsSection}>
            <Text style={styles.label}>Quick Select</Text>
            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonActive,
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      amount === quickAmount.toString() && styles.quickAmountTextActive,
                    ]}
                  >
                    {quickAmount} SEK
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.paymentMethodSection}>
            <Text style={styles.label}>Payment Method</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                selectedMethod === 'stripe' && styles.paymentMethodButtonActive,
              ]}
              onPress={() => setSelectedMethod('stripe')}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[styles.paymentMethodIcon, { backgroundColor: '#635BFF20' }]}>
                  <IconSymbol
                    ios_icon_name="creditcard.fill"
                    android_material_icon_name="credit_card"
                    size={24}
                    color="#635BFF"
                  />
                </View>
                <View>
                  <Text style={styles.paymentMethodTitle}>Stripe</Text>
                  <Text style={styles.paymentMethodSubtitle}>Credit/Debit Card</Text>
                </View>
              </View>
              {selectedMethod === 'stripe' && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={24}
                  color={colors.gradientEnd}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                selectedMethod === 'paypal' && styles.paymentMethodButtonActive,
              ]}
              onPress={() => setSelectedMethod('paypal')}
            >
              <View style={styles.paymentMethodLeft}>
                <View style={[styles.paymentMethodIcon, { backgroundColor: '#00457C20' }]}>
                  <IconSymbol
                    ios_icon_name="dollarsign.circle.fill"
                    android_material_icon_name="account_balance_wallet"
                    size={24}
                    color="#00457C"
                  />
                </View>
                <View>
                  <Text style={styles.paymentMethodTitle}>PayPal</Text>
                  <Text style={styles.paymentMethodSubtitle}>PayPal Account</Text>
                </View>
              </View>
              {selectedMethod === 'paypal' && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={24}
                  color={colors.gradientEnd}
                />
              )}
            </TouchableOpacity>
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
              Payments are processed securely. Your balance will be available immediately after successful payment.
            </Text>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title={loading ? 'PROCESSING...' : 'ADD BALANCE'}
              onPress={handleAddBalance}
              disabled={loading || !amount || !selectedMethod || parseFloat(amount) < 1 || parseFloat(amount) > 1000}
            />
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  quickAmountsSection: {
    marginBottom: 24,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quickAmountButtonActive: {
    backgroundColor: colors.gradientEnd,
    borderColor: colors.gradientEnd,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quickAmountTextActive: {
    color: colors.background,
  },
  paymentMethodSection: {
    marginBottom: 24,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentMethodButtonActive: {
    borderColor: colors.gradientEnd,
    borderWidth: 2,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
});
