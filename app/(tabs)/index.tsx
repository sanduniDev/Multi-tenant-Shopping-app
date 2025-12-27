import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
  CardStyles,
  Backgrounds,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useBrowseStore } from '@/store/browse-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { ProductCardHorizontal } from '@/components/ui/product-card';
import { HeaderActions } from '@/components/ui/header-icons';
import { Category } from '@/types/database';
import { LinearGradient } from 'expo-linear-gradient';

type IconName = keyof typeof Ionicons.glyphMap;

// Prefer specific mappings first, then fall back to keyword-based matches.
const CATEGORY_ICON_MAP: Record<string, IconName> = {
  electronics: 'laptop-outline',
  gadgets: 'phone-portrait-outline',
  smartphones: 'phone-portrait-outline',
  mobiles: 'phone-portrait-outline',
  computers: 'laptop-outline',
  laptops: 'laptop-outline',
  cameras: 'camera-outline',
  fashion: 'shirt-outline',
  clothing: 'shirt-outline',
  apparel: 'shirt-outline',
  shoes: 'walk-outline',
  footwear: 'walk-outline',
  home: 'home-outline',
  furniture: 'bed-outline',
  decor: 'color-palette-outline',
  beauty: 'flower-outline',
  cosmetics: 'sparkles-outline',
  skincare: 'sparkles-outline',
  sports: 'football-outline',
  outdoors: 'leaf-outline',
  fitness: 'barbell-outline',
  books: 'book-outline',
  stationery: 'pencil-outline',
  toys: 'game-controller-outline',
  games: 'game-controller-outline',
  baby: 'rose-outline',
  kids: 'happy-outline',
  food: 'fast-food-outline',
  groceries: 'basket-outline',
  health: 'medical-outline',
  wellness: 'heart-outline',
  pharmacy: 'medkit-outline',
  automotive: 'car-outline',
  tools: 'construct-outline',
  hardware: 'hammer-outline',
  office: 'briefcase-outline',
  pets: 'paw-outline',
  pet: 'paw-outline',
};

const FALLBACK_ICONS: IconName[] = [
  'grid-outline',
  'albums-outline',
  'pricetag-outline',
  'basket-outline',
  'leaf-outline',
  'wine-outline',
  'bulb-outline',
  'flame-outline',
  'construct-outline',
  'cube-outline',
  'people-outline',
  'planet-outline',
];

const KEYWORD_ICON_MAP: { keywords: string[]; icon: IconName }[] = [
  { keywords: ['elect', 'tech', 'gadget', 'device'], icon: 'laptop-outline' },
  { keywords: ['phone', 'mobile'], icon: 'phone-portrait-outline' },
  { keywords: ['fashion', 'cloth', 'apparel', 'wear'], icon: 'shirt-outline' },
  { keywords: ['home', 'living', 'decor'], icon: 'home-outline' },
  { keywords: ['beauty', 'cosmetic', 'skin', 'makeup'], icon: 'sparkles-outline' },
  { keywords: ['sport', 'outdoor', 'fitness', 'gym'], icon: 'barbell-outline' },
  { keywords: ['book', 'read', 'stationery', 'study'], icon: 'book-outline' },
  { keywords: ['toy', 'game', 'kid', 'baby'], icon: 'game-controller-outline' },
  { keywords: ['food', 'grocery', 'drink', 'snack'], icon: 'fast-food-outline' },
  { keywords: ['health', 'medical', 'pharmacy'], icon: 'medical-outline' },
  { keywords: ['auto', 'car', 'vehicle', 'bike'], icon: 'car-outline' },
  { keywords: ['pet', 'animal'], icon: 'paw-outline' },
  { keywords: ['office', 'work', 'stationery'], icon: 'briefcase-outline' },
];

const getCategoryIcon = (category: Category): IconName => {
  const base = (category.slug || category.name || '').toLowerCase();
  const normalized = base.replace(/[\s_]+/g, '-');

  if (CATEGORY_ICON_MAP[normalized]) {
    return CATEGORY_ICON_MAP[normalized];
  }

  const keywordMatch = KEYWORD_ICON_MAP.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );
  if (keywordMatch) {
    return keywordMatch.icon;
  }

  // Deterministic fallback to avoid duplicate "grid" icons across unknown slugs.
  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_ICONS[hash % FALLBACK_ICONS.length];
};

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={PrimaryColors.blue} />
        </Pressable>
      )}
    </View>
  );
}

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#eaf2ff', '#d7e7ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.categoryCard}
      >
        <View style={styles.categoryIcon}>
          <Ionicons name={getCategoryIcon(category)} size={24} color={PrimaryColors.blue} />
        </View>
        <Text style={styles.categoryName} numberOfLines={2} ellipsizeMode="tail">
          {category.name}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user, profile } = useAuthStore();
  const {
    featuredProducts,
    popularProducts,
    recentProducts,
    categories,
    homeLoading,
    fetchHomeData,
  } = useBrowseStore();
  // Subscribe to productIdsArray to trigger re-renders when wishlist changes
  const { productIdsArray, toggleItem: toggleWishlist, fetchProductIds } = useWishlistStore();

  // Helper function to check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return productIdsArray.includes(productId);
  }, [productIdsArray]);

  // Load home data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
      if (user?.id) {
        fetchProductIds(user.id);
      }
    }, [fetchHomeData, user?.id])
  );

  const handleWishlistPress = async (productId: string) => {
    if (user?.id) {
      await toggleWishlist(user.id, productId);
    }
  };

  const handleSearch = () => {
    router.push('/(tabs)/explore');
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { categoryId: category.id, categoryName: category.name },
    });
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleSeeAllFeatured = () => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { sort: 'rating' },
    });
  };

  const handleSeeAllPopular = () => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { sort: 'popular' },
    });
  };

  const handleSeeAllRecent = () => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { sort: 'newest' },
    });
  };

  const handleSeeAllCategories = () => {
    router.push('/(tabs)/explore');
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={homeLoading} onRefresh={fetchHomeData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {profile?.full_name || 'Shopper'}
            </Text>
          </View>
          <HeaderActions showCart showWishlist />
        </View>

        {/* Search Bar */}
        <Pressable onPress={handleSearch}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? Colors.dark.surface : GrayColors[100],
              },
            ]}
          >
            <Ionicons name="search" size={20} color={GrayColors[400]} />
            <Text style={[styles.searchPlaceholder, { color: GrayColors[400] }]}>
              Search products...
            </Text>
            <View style={styles.searchDivider} />
            <Ionicons name="options-outline" size={20} color={GrayColors[400]} />
          </View>
        </Pressable>

        {/* Categories Section */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Categories" onSeeAll={handleSeeAllCategories} />
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <CategoryCard
                  category={item}
                  onPress={() => handleCategoryPress(item)}
                />
              )}
            />
          </View>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Featured Products" onSeeAll={handleSeeAllFeatured} />
            <FlatList
              data={featuredProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }) => (
                <ProductCardHorizontal
                  product={item}
                  onPress={() => handleProductPress(item.id)}
                  onWishlistPress={() => handleWishlistPress(item.id)}
                  isWishlisted={isInWishlist(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Popular Products */}
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Popular Now" onSeeAll={handleSeeAllPopular} />
            <FlatList
              data={popularProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }) => (
                <ProductCardHorizontal
                  product={item}
                  onPress={() => handleProductPress(item.id)}
                  onWishlistPress={() => handleWishlistPress(item.id)}
                  isWishlisted={isInWishlist(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Recently Added */}
        {recentProducts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Just In" onSeeAll={handleSeeAllRecent} />
            <FlatList
              data={recentProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }) => (
                <ProductCardHorizontal
                  product={item}
                  onPress={() => handleProductPress(item.id)}
                  onWishlistPress={() => handleWishlistPress(item.id)}
                  isWishlisted={isInWishlist(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* Empty State */}
        {!homeLoading &&
          featuredProducts.length === 0 &&
          popularProducts.length === 0 &&
          recentProducts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color={GrayColors[300]} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No products available
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Check back later for new arrivals
              </Text>
            </View>
          )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.bodySmall,
  },
  userName: {
    ...Typography.h2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    ...Typography.body,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: GrayColors[300],
    marginHorizontal: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    ...Typography.bodySmall,
    color: PrimaryColors.blue,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryCard: {
    width: 82,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xs'],
    paddingHorizontal: Spacing['2xs'],
    paddingVertical: Spacing['2xs'],
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    shadowColor: '#2B6CB0',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#d3e5ff',
  },
  categoryName: {
    ...Typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
    color: PrimaryColors.blue,
  },
  productsList: {
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['6xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
