
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { creatorClubService, CreatorClub } from '@/app/services/creatorClubService';
import { walletService } from '@/app/services/walletService';
import GradientButton from '@/components/GradientButton';

interface JoinClubModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  userId: string;
  onJoinSuccess?: () => void;
}

export default function JoinClubModal({
  visible,
  onClose,
  creatorId,
  userId,
  onJoinSuccess,
}: JoinClubModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [club, setClub] = useState<CreatorClub | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, creatorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load club data
      const clubData = await creatorClubService.getClubByCreator(creatorId);
      setClub(clubData);

      // Check if already a member
      if (clubData) {
        const memberStatus = await creatorClubService.isMember(clubData.id, userId);
        setIsMember(memberStatus);
      }

      // Load wallet balance
      const balance = await walletService.getBalance(userId);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error loading club data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!club) return;

    // Check if user has enough balance
    if (walletBalance < club.monthly_price_cents) {
      Alert.alert(
        'Insufficient Balance',
        'You don&apos;t have enough balance to join this club. Please add funds to your wallet first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Funds', onPress: () => {
            onClose();
            // Navigate to add balance screen
          }},
        ]
      );
      return;
    }

    setJoining(true);
    try {
      // Join the club
      const joinResult = await creatorClubService.joinClub(club.id, userId);
      if (!joinResult.success) {
        Alert.alert('Error', joinResult.error || 'Failed to join club');
        return;
      }

      // Process payment
      const paymentResult = await walletService.processSubscriptionPayment(
        userId,
        creatorId,
        club.id,
        club.monthly_price_cents
      );

      if (!paymentResult.success) {
        Alert.alert('Error', paymentResult.error || 'Payment failed');
        return;
      }

      Alert.alert(
        'Success!',
        `You&apos;ve joined ${club.name}! Your ${club.tag} badge is now active.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onJoinSuccess?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error joining club:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setJoining(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Join VIP Club</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
            </View>
          ) : !club ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.errorText, { color: colors.text }]}>
                This creator doesn&apos;t have a VIP club yet
              </Text>
            </View>
          ) : isMember ? (
            <View style={styles.alreadyMemberContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={64}
                color={colors.brandPrimary}
              />
              <Text style={[styles.alreadyMemberText, { color: colors.text }]}>
                You&apos;re already a member!
              </Text>
              <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                <Text style={styles.badgeText}>{club.tag}</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Club Info */}
              <View style={styles.content}>
                <View style={[styles.clubHeader, { backgroundColor: colors.backgroundAlt }]}>
                  <Text style={[styles.clubName, { color: colors.text }]}>{club.name}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.brandPrimary }]}>
                    <Text style={styles.badgeText}>{club.tag}</Text>
                  </View>
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                    Monthly Price
                  </Text>
                  <Text style={[styles.price, { color: colors.text }]}>
                    kr {(club.monthly_price_cents / 100).toFixed(2)}
                  </Text>
                </View>

                {/* Description */}
                {club.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={[styles.description, { color: colors.text }]}>
                      {club.description}
                    </Text>
                  </View>
                )}

                {/* Benefits */}
                <View style={styles.benefitsSection}>
                  <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                    What You Get
                  </Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Custom {club.tag} badge in this creator&apos;s livestream
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Priority in chat
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={20}
                        color={colors.brandPrimary}
                      />
                      <Text style={[styles.benefitText, { color: colors.text }]}>
                        Support your favorite creator
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Wallet Balance */}
                <View style={[styles.balanceCard, { backgroundColor: colors.backgroundAlt }]}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    Your Wallet Balance
                  </Text>
                  <Text style={[styles.balanceAmount, { color: colors.text }]}>
                    kr {(walletBalance / 100).toFixed(2)}
                  </Text>
                  {walletBalance < club.monthly_price_cents && (
                    <Text style={[styles.insufficientText, { color: colors.brandPrimary }]}>
                      Insufficient balance - please add funds
                    </Text>
                  )}
                </View>
              </View>

              {/* Join Button */}
              <View style={styles.footer}>
                <GradientButton
                  title="Join Club"
                  onPress={handleJoin}
                  loading={joining}
                  disabled={joining || walletBalance < club.monthly_price_cents}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  alreadyMemberContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  alreadyMemberText: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  insufficientText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
});
