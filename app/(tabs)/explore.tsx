import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  Backgrounds,
} from '@/constants/theme';
import { useBrowseStore } from '@/store/browse-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useAuthStore } from '@/store/auth-store';
import { ProductCard } from '@/components/ui/product-card';
import { HeaderActions } from '@/components/ui/header-icons';
import { ProductWithDetails, SortOption } from '@/services/browse-service';

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'rating', label: 'Highest Rated' },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const params = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
    sort?: SortOption;
  }>();

  const { user } = useAuthStore();
  // Subscribe to productIdsArray to trigger re-renders when wishlist changes
  const { productIdsArray, toggleItem: toggleWishlist } = useWishlistStore();

  // Helper function to check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return productIdsArray.includes(productId);
  }, [productIdsArray]);

  const {
    products,
    categories,
    filters,
    sortOption,
    viewMode,
    loading,
    loadingMore,
    hasMore,
    priceRange,
    totalCount,
    setViewMode,
    setFilters,
    setSortOption,
    fetchProducts,
    fetchMoreProducts,
    fetchCategories,
    fetchPriceRange,
    clearFilters,
  } = useBrowseStore();

  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Temp filter state for modal
  const [tempCategoryId, setTempCategoryId] = useState<string | undefined>(
    filters.categoryId
  );
  const [tempMinPrice, setTempMinPrice] = useState<string>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('');

  // Initialize with URL params
  useEffect(() => {
    if (params.categoryId) {
      setFilters({ ...filters, categoryId: params.categoryId });
      setTempCategoryId(params.categoryId);
    }
    if (params.sort) {
      setSortOption(params.sort);
    }
  }, [params.categoryId, params.sort]);

  // Load initial data
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      fetchPriceRange();
      fetchProducts(true);
    }, [filters, sortOption])
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== (filters.search || '')) {
        setFilters({ ...filters, search: searchText || undefined });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleProductPress = (product: ProductWithDetails) => {
    router.push(`/product/${product.id}` as any);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchMoreProducts();
    }
  };

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      categoryId: tempCategoryId,
      minPrice: tempMinPrice ? parseFloat(tempMinPrice) : undefined,
      maxPrice: tempMaxPrice ? parseFloat(tempMaxPrice) : undefined,
    });
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setTempCategoryId(undefined);
    setTempMinPrice('');
    setTempMaxPrice('');
    clearFilters();
    setSearchText('');
    setShowFilterModal(false);
  };

  const handleSortSelect = (sort: SortOption) => {
    setSortOption(sort);
    setShowSortModal(false);
  };

  const activeFiltersCount = [
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const handleWishlistPress = async (productId: string) => {
    if (user?.id) {
      await toggleWishlist(user.id, productId);
    }
  };

  const renderProduct = ({ item }: { item: ProductWithDetails }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ProductCard
        product={item}
        viewMode={viewMode}
        onPress={() => handleProductPress(item)}
        onWishlistPress={() => handleWishlistPress(item.id)}
        isWishlisted={isInWishlist(item.id)}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
        {totalCount} {totalCount === 1 ? 'product' : 'products'} found
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={PrimaryColors.blue} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color={GrayColors[300]} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No products found
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Try adjusting your filters or search terms
        </Text>
        {activeFiltersCount > 0 && (
          <Pressable
            style={[styles.clearBtn, { backgroundColor: PrimaryColors.blue }]}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        {params.categoryId ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        ) : null}
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, flex: 1 },
          ]}
        >
          {params.categoryName || 'Explore'}
        </Text>
        <HeaderActions showCart showWishlist />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? Colors.dark.surface : GrayColors[100],
            },
          ]}
        >
          <Ionicons name="search" size={20} color={GrayColors[400]} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search products..."
            placeholderTextColor={GrayColors[400]}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={GrayColors[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter & Sort Bar */}
      <View style={styles.filterBar}>
        <Pressable
          style={[
            styles.filterBtn,
            {
              backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
              borderColor: activeFiltersCount > 0 ? PrimaryColors.blue : theme.border,
            },
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFiltersCount > 0 ? PrimaryColors.blue : theme.text}
          />
          <Text
            style={[
              styles.filterBtnText,
              { color: activeFiltersCount > 0 ? PrimaryColors.blue : theme.text },
            ]}
          >
            Filter
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.filterBtn,
            {
              backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
              borderColor: theme.border,
            },
          ]}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={theme.text} />
          <Text style={[styles.filterBtnText, { color: theme.text }]}>
            {sortOptions.find((s) => s.key === sortOption)?.label || 'Sort'}
          </Text>
        </Pressable>

        <View style={styles.viewToggle}>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'grid' && {
                backgroundColor: PrimaryColors.blue,
              },
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={viewMode === 'grid' ? '#FFFFFF' : GrayColors[500]}
            />
          </Pressable>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'list' && {
                backgroundColor: PrimaryColors.blue,
              },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'list' ? '#FFFFFF' : GrayColors[500]}
            />
          </Pressable>
        </View>
      </View>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={styles.productsList}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchProducts(true)}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.text }]}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  <Pressable
                    style={[
                      styles.categoryChip,
                      !tempCategoryId && styles.categoryChipActive,
                    ]}
                    onPress={() => setTempCategoryId(undefined)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        !tempCategoryId && styles.categoryChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        tempCategoryId === category.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setTempCategoryId(category.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          tempCategoryId === category.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.text }]}>
                  Price Range
                </Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInputContainer}>
                    <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
                      Min
                    </Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: isDark ? Colors.dark.background : GrayColors[100],
                          color: theme.text,
                        },
                      ]}
                      placeholder={`${priceRange.min}`}
                      placeholderTextColor={GrayColors[400]}
                      keyboardType="numeric"
                      value={tempMinPrice}
                      onChangeText={setTempMinPrice}
                    />
                  </View>
                  <Text style={[styles.priceDash, { color: theme.textSecondary }]}>-</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
                      Max
                    </Text>
                    <TextInput
                      style={[
                        styles.priceInput,
                        {
                          backgroundColor: isDark ? Colors.dark.background : GrayColors[100],
                          color: theme.text,
                        },
                      ]}
                      placeholder={`${priceRange.max}`}
                      placeholderTextColor={GrayColors[400]}
                      keyboardType="numeric"
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOutline]}
                onPress={handleClearFilters}
              >
                <Text style={[styles.modalBtnText, { color: PrimaryColors.blue }]}>
                  Clear All
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: PrimaryColors.blue }]}
                onPress={handleApplyFilters}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.sortModalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              styles.sortModalContent,
              { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
            ]}
          >
            <View style={styles.sortModalHandle} />
            <Text style={[styles.sortModalTitle, { color: theme.text }]}>Sort By</Text>
            {sortOptions.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortOption,
                  sortOption === option.key && {
                    backgroundColor: PrimaryColors.blue50,
                  },
                ]}
                onPress={() => handleSortSelect(option.key)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: sortOption === option.key ? PrimaryColors.blue : theme.text },
                  ]}
                >
                  {option.label}
                </Text>
                {sortOption === option.key && (
                  <Ionicons name="checkmark" size={20} color={PrimaryColors.blue} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 6,
  },
  filterBtnText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: PrimaryColors.blue,
    borderRadius: BorderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 'auto',
    backgroundColor: GrayColors[100],
    borderRadius: BorderRadius.lg,
    padding: 2,
  },
  viewToggleBtn: {
    width: 36,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  resultsText: {
    ...Typography.bodySmall,
  },
  gridItem: {
    width: '50%',
    paddingRight: Spacing.sm,
  },
  listItem: {
    width: '100%',
  },
  loadingFooter: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['6xl'],
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  clearBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  clearBtnText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '600',
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: GrayColors[200],
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: GrayColors[100],
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: PrimaryColors.blue,
  },
  categoryChipText: {
    ...Typography.bodySmall,
    color: GrayColors[600],
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  priceInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Typography.body,
  },
  priceDash: {
    ...Typography.h4,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: GrayColors[200],
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalBtnOutline: {
    borderWidth: 1,
    borderColor: PrimaryColors.blue,
  },
  modalBtnText: {
    ...Typography.body,
    fontWeight: '600',
  },

  // Sort Modal
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
  },
  sortModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: GrayColors[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sortModalTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  sortOptionText: {
    ...Typography.body,
  },
});
