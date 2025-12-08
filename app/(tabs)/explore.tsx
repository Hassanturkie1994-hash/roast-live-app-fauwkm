
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import LiveBadge from '@/components/LiveBadge';

interface Category {
  id: string;
  name: string;
  thumbnail: string;
  viewerCount: number;
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Gaming',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    viewerCount: 45000,
  },
  {
    id: '2',
    name: 'Cooking',
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
    viewerCount: 28000,
  },
  {
    id: '3',
    name: 'Music',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    viewerCount: 35000,
  },
  {
    id: '4',
    name: 'Art',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    viewerCount: 18000,
  },
  {
    id: '5',
    name: 'Fitness',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    viewerCount: 22000,
  },
  {
    id: '6',
    name: 'Tech',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    viewerCount: 31000,
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryPress = (categoryId: string) => {
    console.log('Category pressed:', categoryId);
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ROAST LIVE</Text>
        </View>
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search streams..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Browse Categories</Text>

        <View style={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: category.thumbnail }} style={styles.categoryImage} />
              <View style={styles.categoryOverlay}>
                <View style={styles.categoryBadge}>
                  <LiveBadge size="small" showPulse={false} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.categoryViewers}>
                    <IconSymbol
                      ios_icon_name="eye.fill"
                      android_material_icon_name="visibility"
                      size={12}
                      color={colors.text}
                    />
                    <Text style={styles.categoryViewerCount}>
                      {formatCount(category.viewerCount)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Trending Now</Text>
        <View style={styles.trendingContainer}>
          {[1, 2, 3].map((item, index) => (
            <TouchableOpacity key={index} style={styles.trendingCard}>
              <View style={styles.trendingRank}>
                <Text style={styles.trendingRankText}>{item}</Text>
              </View>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingTitle}>Trending Stream #{item}</Text>
                <Text style={styles.trendingSubtitle}>
                  {formatCount(50000 - item * 5000)} viewers
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryInfo: {
    gap: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  categoryViewers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryViewerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  trendingContainer: {
    gap: 12,
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendingRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gradientEnd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingRankText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  trendingInfo: {
    flex: 1,
    gap: 4,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  trendingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
