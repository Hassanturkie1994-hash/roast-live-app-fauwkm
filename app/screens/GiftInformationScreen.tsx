
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchGifts, Gift } from '@/app/services/giftService';

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

  const renderGiftCard = (gift: Gift, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.giftCard}
      onPress={() => setSelectedGift(gift)}
      activeOpacity={0.8}
    >
      <View style={styles.giftImageContainer}>
        {gift.icon_url ? (
          <Image source={{ uri: gift.icon_url }} style={styles.giftImage} />
        ) : (
          <View style={styles.giftPlaceholder}>
            <IconSymbol
              ios_icon_name="gift.fill"
              android_material_icon_name="card_giftcard"
              size={40}
              color={colors.gradientEnd}
            />
          </View>
        )}
      </View>
      <Text style={styles.giftName} numberOfLines={1}>
        {gift.name}
      </Text>
      <Text style={styles.giftPrice}>{gift.price_sek} SEK</Text>
    </TouchableOpacity>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>🔥 Roast Live Gifts</Text>
            <Text style={styles.introText}>
              Send savage gifts during live streams to roast or support your favorite creators. Each gift has its own unique meaning and impact!
            </Text>
          </View>

          <View style={styles.giftsGrid}>
            {gifts.map((gift, index) => renderGiftCard(gift, index))}
          </View>
        </ScrollView>
      )}

      {/* Gift Detail Modal */}
      {selectedGift && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedGift(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGift.name}</Text>
              <TouchableOpacity onPress={() => setSelectedGift(null)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalImageContainer}>
                {selectedGift.icon_url ? (
                  <Image source={{ uri: selectedGift.icon_url }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalPlaceholder}>
                    <IconSymbol
                      ios_icon_name="gift.fill"
                      android_material_icon_name="card_giftcard"
                      size={80}
                      color={colors.gradientEnd}
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalPriceContainer}>
                <Text style={styles.modalPrice}>{selectedGift.price_sek} SEK</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalSectionText}>{selectedGift.description}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How to Use</Text>
                <Text style={styles.modalSectionText}>
                  - Tap the gift icon during a live stream{'\n'}
                  - Select this gift from the menu{'\n'}
                  - Confirm your purchase{'\n'}
                  - Watch the animation appear on screen!
                </Text>
              </View>

              <View style={styles.infoCard}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={18}
                  color={colors.gradientEnd}
                />
                <Text style={styles.infoText}>
                  Gifts are purchased using your Saldo balance. Make sure you have enough balance before sending!
                </Text>
              </View>
            </View>
          </View>
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
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  giftCard: {
    width: cardWidth,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  giftImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  giftPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    maxHeight: '80%',
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
  modalImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPriceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gradientEnd,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
