import React, { useEffect, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  SemanticColors,
  Typography,
  Spacing,
  BorderRadius,
  CardStyles,
  Backgrounds,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useProductStore } from '@/store/product-store';
import { formatPrice } from '@/services/product-service';
import { Product } from '@/types/database';
import { useToast } from '@/context/toast-context';

type FilterOption = 'all' | 'active' | 'inactive' | 'out_of_stock';

const filterOptions: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'out_of_stock', label: 'Out of Stock' },
];

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function ProductCard({ product, onPress, onToggleStatus, onDelete }: ProductCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardStyle = isDark ? CardStyles.dark : CardStyles.light;

  const isOutOfStock = product.inventory_count === 0;
  const isActive = product.is_active && !isOutOfStock;

  const getStatusColor = () => {
    if (isOutOfStock) return SemanticColors.warning;
    if (product.is_active) return SemanticColors.success;
    return GrayColors[400];
  };

  const getStatusText = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (product.is_active) return 'Active';
    return 'Inactive';
  };

  return (
    <Pressable
      style={[
        styles.productCard,
        cardStyle,
      ]}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: GrayColors[100] }]}>
            <Ionicons name="image-outline" size={32} color={GrayColors[400]} />
          </View>
        )}
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={[styles.productPrice, { color: PrimaryColors.blue }]}>
          {formatPrice(product.price)}
        </Text>
        <View style={styles.productMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {product.inventory_count} in stock
            </Text>
          </View>
          {product.review_count > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {product.average_rating?.toFixed(1)} ({product.review_count})
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.productActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: PrimaryColors.blue50 }]}
          onPress={onToggleStatus}
        >
          <Ionicons
            name={product.is_active ? 'pause' : 'play'}
            size={18}
            color={PrimaryColors.blue}
          />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: SemanticColors.errorBg }]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color={SemanticColors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ProductsListScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const { user } = useAuthStore();
  const {
    products,
    loading,
    statusFilter,
    searchQuery,
    categories,
    categoryFilter,
    setStatusFilter,
    setCategoryFilter,
    setSearchQuery,
    fetchProducts,
    fetchCategories,
    toggleStatus,
    removeProduct,
  } = useProductStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const loadProducts = useCallback(() => {
    if (user?.id) {
      fetchProducts(user.id);
    }
  }, [user?.id, fetchProducts]);

  // Refetch products every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProducts();
      fetchCategories();
    }, [loadProducts, fetchCategories])
  );

  // Also refetch when filter changes
  useEffect(() => {
    loadProducts();
  }, [statusFilter, categoryFilter]);

  // Ensure categories are loaded
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
        loadProducts();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/(tabs)/seller/edit-product',
      params: { id: product.id },
    });
  };

  const handleToggleStatus = async (product: Product) => {
    if (!user?.id) return;

    const { success, error } = await toggleStatus(product.id, user.id, !product.is_active);

    if (success) {
      showToast({
        message: product.is_active ? 'Product deactivated' : 'Product activated',
        type: 'success',
      });
    } else {
      showToast({ message: error || 'Failed to update', type: 'error' });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === 'web') {
          // Use window.confirm for web
          const confirmed = window.confirm(
            `Are you sure you want to delete "${product.title}"? This action cannot be undone.`
          );
          resolve(confirmed);
        } else {
          // Use Alert.alert for native
          Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) }
          );
        }
      });
    };

    const confirmed = await confirmDelete();
    if (!confirmed) return;

    if (!user?.id) return;

    const { success, error } = await removeProduct(product.id, user.id);
    if (success) {
      showToast({ message: 'Product deleted', type: 'success' });
    } else {
      showToast({ message: error || 'Failed to delete', type: 'error' });
    }
  };

  const handleAddProduct = () => {
    router.push('/(tabs)/seller/add-product');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={GrayColors[300]} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No products yet</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Start selling by adding your first product
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: PrimaryColors.blue }]}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add Product</Text>
      </Pressable>
    </View>
  );

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Products</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: PrimaryColors.blue }]}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
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
            value={localSearch}
            onChangeText={setLocalSearch}
          />
          {localSearch.length > 0 && (
            <Pressable onPress={() => setLocalSearch('')}>
              <Ionicons name="close-circle" size={20} color={GrayColors[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              styles.filterTab,
              statusFilter === option.key && {
                backgroundColor: PrimaryColors.blue,
              },
            ]}
            onPress={() => setStatusFilter(option.key)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: statusFilter === option.key ? '#FFFFFF' : theme.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <Text style={[styles.categoryLabel, { color: theme.text }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <Pressable
            style={[
              styles.categoryChip,
              !categoryFilter && styles.categoryChipActive,
            ]}
            onPress={() => setCategoryFilter(undefined)}
          >
            <Text
              style={[
                styles.categoryChipText,
                !categoryFilter && styles.categoryChipTextActive,
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
                categoryFilter === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setCategoryFilter(category.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categoryFilter === category.id && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            onToggleStatus={() => handleToggleStatus(item)}
            onDelete={() => handleDeleteProduct(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadProducts} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
  },
  filterText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  categoryLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
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
  productCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  productTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
  },
  productActions: {
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '600',
  },
});
