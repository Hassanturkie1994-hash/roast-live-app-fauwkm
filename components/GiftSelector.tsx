
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { fetchGifts, purchaseGift, Gift, getGiftTier } from '@/app/services/giftService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';

interface GiftSelectorProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  livestreamId?: string;
  onGiftSent?: (giftEvent: any) => void;
}

export default function GiftSelector({
  visible,
  onClose,
  receiverId,
  receiverName,
  livestreamId,
  onGiftSent,
}: GiftSelectorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [giftsResult, walletResult] = await Promise.all([
        fetchGifts(),
        supabase.from('wallet').select('balance').eq('user_id', user.id).single(),
      ]);

      if (giftsResult.data) {
        setGifts(giftsResult.data);
      }

      if (walletResult.data) {
        setWalletBalance(parseFloat(walletResult.data.balance));
      } else {
        // Create wallet if it doesn't exist
        await supabase.from('wallet').insert({ user_id: user.id, balance: 0 });
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedGift) return;

    if (walletBalance < selectedGift.price_sek) {
      Alert.alert(
        'Insufficient Balance',
        'You need to add money to send gifts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Balance',
            onPress: () => {
              onClose();
              router.push('/screens/AddBalanceScreen');
            },
          },
        ]
      );
      return;
    }

    setPurchasing(true);

    try {
      const result = await purchaseGift(
        selectedGift.id,
        user.id,
        receiverId,
        livestreamId
      );

      if (result.success && result.giftEvent) {
        // Notify parent component about the gift
        if (onGiftSent) {
          onGiftSent(result.giftEvent);
        }

        Alert.alert(
          'Gift Sent! 🎁',
          `You sent ${selectedGift.name} to ${receiverName}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedGift(null);
                onClose();
              },
            },
          ]
        );

        // Refresh wallet balance
        const { data } = await supabase
          .from('wallet')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setWalletBalance(parseFloat(data.balance));
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to purchase gift');
      }
    } catch (error) {
      console.error('Error purchasing gift:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const getTierColor = (price: number) => {
    const tier = getGiftTier(price);
    if (tier === 'high') return '#FFD700';
    if (tier === 'medium') return colors.gradientEnd;
    return colors.textSecondary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Send Gift</Text>
              <Text style={styles.headerSubtitle}>to {receiverName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceBar}>
            <View style={styles.balanceLeft}>
              <IconSymbol
                ios_icon_name="wallet.pass.fill"
                android_material_icon_name="account_balance_wallet"
                size={20}
                color={colors.gradientEnd}
              />
              <Text style={styles.balanceText}>Balance: {walletBalance.toFixed(2)} kr</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push('/screens/AddBalanceScreen');
              }}
            >
              <Text style={styles.addBalanceText}>Add +</Text>
            </TouchableOpacity>
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
              <View style={styles.giftsGrid}>
                {gifts.map((gift, index) => {
                  const isDisabled = walletBalance < gift.price_sek;
                  const tierColor = getTierColor(gift.price_sek);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.giftCard,
                        selectedGift?.id === gift.id && styles.giftCardSelected,
                        isDisabled && styles.giftCardDisabled,
                        { borderColor: selectedGift?.id === gift.id ? tierColor : colors.border },
                      ]}
                      onPress={() => setSelectedGift(gift)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={styles.giftImageContainer}>
                        {gift.icon_url ? (
                          <Image source={{ uri: gift.icon_url }} style={styles.giftImage} />
                        ) : (
                          <View style={styles.giftPlaceholder}>
                            <IconSymbol
                              ios_icon_name="gift.fill"
                              android_material_icon_name="card_giftcard"
                              size={32}
                              color={tierColor}
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.giftName} numberOfLines={2}>
                        {gift.name}
                      </Text>
                      <Text
                        style={[
                          styles.giftPrice,
                          { color: tierColor },
                          isDisabled && styles.giftPriceDisabled,
                        ]}
                      >
                        {gift.price_sek} kr
                      </Text>
                      {selectedGift?.id === gift.id && (
                        <View style={styles.selectedBadge}>
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={20}
                            color={tierColor}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {selectedGift && (
            <View style={styles.footer}>
              <View style={styles.selectedGiftInfo}>
                <View>
                  <Text style={styles.selectedGiftName}>{selectedGift.name}</Text>
                  <Text style={styles.selectedGiftDesc} numberOfLines={1}>
                    {selectedGift.description}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.selectedGiftPrice,
                    { color: getTierColor(selectedGift.price_sek) },
                  ]}
                >
                  {selectedGift.price_sek} kr
                </Text>
              </View>
              <View style={styles.footerButton}>
                <GradientButton
                  title={purchasing ? 'SENDING...' : 'SEND GIFT'}
                  onPress={handlePurchase}
                  disabled={purchasing}
                  size="medium"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  giftCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  giftCardSelected: {
    backgroundColor: colors.backgroundAlt,
  },
  giftCardDisabled: {
    opacity: 0.4,
  },
  giftImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  giftPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
    minHeight: 28,
  },
  giftPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  giftPriceDisabled: {
    color: colors.textSecondary,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  selectedGiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedGiftName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedGiftDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedGiftPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  footerButton: {
    width: '100%',
  },
});
