
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchGifts, Gift, GiftTier } from '@/app/services/giftService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2;

export default function GiftInformationScreen() {
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      const { data, error } = await fetchGifts();
      if (error) {
        console.error('Error loading gifts:', error);
      } else if (data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error in loadGifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return '#FFD700';
      case 'B':
        return colors.gradientEnd;
      case 'A':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getTierLabel = (tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return 'PREMIUM';
      case 'B':
        return 'MEDIUM';
      case 'A':
        return 'CHEAP';
      default:
        return '';
    }
  };

  const getTierDescription = (tier: GiftTier) => {
    switch (tier) {
      case 'C':
        return 'Full-screen effect with neon flames, particle bursts, and gold gradient text. 2-second duration.';
      case 'B':
        return 'Glow pulse with light particle sparks and shake effect. 1.5-second duration.';
      case 'A':
        return 'Small size animation that slides in, bounces, and fades. 1-second duration.';
      default:
        return '';
    }
  };

  const renderGiftCard = ({ item }: { item: Gift }) => (
    <TouchableOpacity
      style={styles.giftCard}
      onPress={() => setSelectedGift(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
        <Text style={styles.tierBadgeText}>{getTierLabel(item.tier)}</Text>
      </View>

      <View style={styles.giftEmojiContainer}>
        <Text style={styles.giftEmoji}>{item.emoji_icon}</Text>
      </View>

      <Text style={styles.giftName} numberOfLines={2}>
        {item.name}
      </Text>

      <Text style={[styles.giftPrice, { color: getTierColor(item.tier) }]}>
        {item.price_sek} kr
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.introSection}>
      <Text style={styles.introTitle}>🔥 Roast Live Gifts</Text>
      <Text style={styles.introText}>
        Send savage gifts during live streams to roast or support your favorite creators. Each gift has its own unique animation and impact!
      </Text>

      <View style={styles.tierInfoContainer}>
        <View style={styles.tierInfoCard}>
          <View style={[styles.tierInfoBadge, { backgroundColor: colors.textSecondary }]}>
            <Text style={styles.tierInfoBadgeText}>CHEAP</Text>
          </View>
          <Text style={styles.tierInfoPrice}>1-19 kr</Text>
          <Text style={styles.tierInfoDesc}>Quick roasts</Text>
        </View>

        <View style={styles.tierInfoCard}>
          <View style={[styles.tierInfoBadge, { backgroundColor: colors.gradientEnd }]}>
            <Text style={styles.tierInfoBadgeText}>MEDIUM</Text>
          </View>
          <Text style={styles.tierInfoPrice}>20-600 kr</Text>
          <Text style={styles.tierInfoDesc}>Solid burns</Text>
        </View>

        <View style={styles.tierInfoCard}>
          <View style={[styles.tierInfoBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.tierInfoBadgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.tierInfoPrice}>600-3000 kr</Text>
          <Text style={styles.tierInfoDesc}>Epic roasts</Text>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Gift Information</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
        </View>
      ) : (
        <FlatList
          data={gifts}
          renderItem={renderGiftCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.contentContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Gift Detail Modal */}
      {selectedGift && (
        <Modal
          visible={!!selectedGift}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedGift(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedGift(null)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Gift Details</Text>
                <TouchableOpacity onPress={() => setSelectedGift(null)}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={28}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalEmojiContainer}>
                  <Text style={styles.modalEmoji}>{selectedGift.emoji_icon}</Text>
                </View>

                <Text style={styles.modalGiftName}>{selectedGift.name}</Text>

                <View style={styles.modalPriceRow}>
                  <Text style={[styles.modalPrice, { color: getTierColor(selectedGift.tier) }]}>
                    {selectedGift.price_sek} kr
                  </Text>
                  <View style={[styles.modalTierBadge, { backgroundColor: getTierColor(selectedGift.tier) }]}>
                    <Text style={styles.modalTierBadgeText}>{getTierLabel(selectedGift.tier)}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalSectionText}>{selectedGift.description}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Animation Tier</Text>
                  <Text style={styles.modalSectionText}>{getTierDescription(selectedGift.tier)}</Text>
                </View>

                {selectedGift.usage_count !== undefined && selectedGift.usage_count > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Popularity</Text>
                    <View style={styles.popularityRow}>
                      <IconSymbol
                        ios_icon_name="flame.fill"
                        android_material_icon_name="local_fire_department"
                        size={20}
                        color={colors.gradientEnd}
                      />
                      <Text style={styles.modalSectionText}>
                        Sent {selectedGift.usage_count} times
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoCard}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={18}
                    color={colors.gradientEnd}
                  />
                  <Text style={styles.infoText}>
                    Send during livestream to appear on screen! Gifts are purchased using your Saldo balance.
                  </Text>
                </View>

                <View style={styles.ctaContainer}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>Send during livestream to appear on screen!</Text>
                  </LinearGradient>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  contentContainer: {
    paddingBottom: 100,
  },
  introSection: {
    padding: 20,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  tierInfoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tierInfoCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierInfoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tierInfoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  tierInfoPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  tierInfoDesc: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  columnWrapper: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 16,
  },
  giftCard: {
    width: cardWidth,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  giftEmojiContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  giftEmoji: {
    fontSize: 56,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
    minHeight: 36,
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalEmojiContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 80,
  },
  modalGiftName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '800',
  },
  modalTierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalTierBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  popularityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  ctaContainer: {
    marginBottom: 20,
  },
  ctaGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
});
