import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  Shadows,
} from '@/constants/theme';
import { useBrowseStore } from '@/store/browse-store';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { ProductCardHorizontal } from '@/components/ui/product-card';
import { formatPrice } from '@/services/product-service';
import { useToast } from '@/context/toast-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const { user } = useAuthStore();
  const {
    selectedProduct,
    relatedProducts,
    loading,
    fetchProduct,
    fetchRelatedProducts,
    clearSelectedProduct,
  } = useBrowseStore();
  const { addItem: addToCart, syncing: cartSyncing } = useCartStore();
  // Subscribe to productIdsArray to trigger re-renders when wishlist changes
  const { productIdsArray, toggleItem: toggleWishlist, syncing: wishlistSyncing } = useWishlistStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const wishlistScaleAnim = useRef(new Animated.Value(1)).current;

  // Helper function to check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return productIdsArray.includes(productId);
  }, [productIdsArray]);

  const isWishlisted = selectedProduct ? isInWishlist(selectedProduct.id) : false;

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
    return () => {
      clearSelectedProduct();
    };
  }, [id]);

  useEffect(() => {
    if (selectedProduct) {
      fetchRelatedProducts(selectedProduct.id, selectedProduct.category_id);
    }
  }, [selectedProduct?.id]);

  const handleBack = () => {
    // Try to go back, if that fails, navigate to explore
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/explore');
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    const maxQty = selectedProduct?.inventory_count ?? 1;
    if (newQty >= 1 && newQty <= maxQty) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!user?.id || !selectedProduct?.id) return;

    const success = await addToCart(user.id, selectedProduct.id, quantity);
    if (success) {
      showToast({ message: 'Added to cart', type: 'success' });
    } else {
      showToast({ message: 'Failed to add to cart', type: 'error' });
    }
  };

  const handleBuyNow = async () => {
    if (!user?.id || !selectedProduct?.id) return;

    // Add to cart first, then navigate to cart/checkout
    const success = await addToCart(user.id, selectedProduct.id, quantity);
    if (success) {
      router.push('/cart');
    } else {
      showToast({ message: 'Failed to add to cart', type: 'error' });
    }
  };

  const handleWishlistPress = async () => {
    if (!user?.id || !selectedProduct?.id) return;

    // Animate the heart
    Animated.sequence([
      Animated.timing(wishlistScaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(wishlistScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    await toggleWishlist(user.id, selectedProduct.id);
    showToast({
      message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      type: 'success',
    });
  };

  const handleRelatedProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  if (loading || !selectedProduct) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  const images = selectedProduct.images || [];
  const hasMultipleImages = images.length > 1;
  const inventoryCount = selectedProduct.inventory_count ?? 0;
  const isLowStock = inventoryCount > 0 && inventoryCount <= 5;
  const isOutOfStock = inventoryCount === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[
            styles.headerBtn,
            { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
            Shadows.sm,
          ]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable
            style={[
              styles.headerBtn,
              { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
              Shadows.sm,
            ]}
            onPress={handleWishlistPress}
            disabled={wishlistSyncing}
          >
            <Animated.View style={{ transform: [{ scale: wishlistScaleAnim }] }}>
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={24}
                color={isWishlisted ? '#EF4444' : theme.text}
              />
            </Animated.View>
          </Pressable>
          <Pressable
            style={[
              styles.headerBtn,
              { backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF' },
              Shadows.sm,
            ]}
          >
            <Ionicons name="share-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {images.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {hasMultipleImages && (
                <View style={styles.imagePagination}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentImageIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View
              style={[styles.imagePlaceholder, { backgroundColor: GrayColors[100] }]}
            >
              <Ionicons name="image-outline" size={64} color={GrayColors[400]} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentSection}>
          {/* Category Badge */}
          {selectedProduct.category && (
            <View style={[styles.categoryBadge, { backgroundColor: PrimaryColors.blue50 }]}>
              <Text style={styles.categoryBadgeText}>
                {selectedProduct.category.name}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {selectedProduct.title}
          </Text>

          {/* Rating */}
          {(selectedProduct.review_count ?? 0) > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {selectedProduct.average_rating?.toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
                ({selectedProduct.review_count} reviews)
              </Text>
            </View>
          )}

          {/* Price */}
          <Text style={[styles.price, { color: PrimaryColors.blue }]}>
            {formatPrice(selectedProduct.price)}
          </Text>

          {/* Stock Status */}
          {isOutOfStock ? (
            <View style={[styles.stockBadge, { backgroundColor: SemanticColors.errorBg }]}>
              <Ionicons name="close-circle" size={16} color={SemanticColors.error} />
              <Text style={[styles.stockText, { color: SemanticColors.error }]}>
                Out of Stock
              </Text>
            </View>
          ) : isLowStock ? (
            <View style={[styles.stockBadge, { backgroundColor: SemanticColors.warningBg }]}>
              <Ionicons name="alert-circle" size={16} color={SemanticColors.warning} />
              <Text style={[styles.stockText, { color: SemanticColors.warning }]}>
                Only {inventoryCount} left in stock
              </Text>
            </View>
          ) : (
            <View style={[styles.stockBadge, { backgroundColor: SemanticColors.successBg }]}>
              <Ionicons name="checkmark-circle" size={16} color={SemanticColors.success} />
              <Text style={[styles.stockText, { color: SemanticColors.success }]}>
                In Stock
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: GrayColors[200] }]} />

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {selectedProduct.description || 'No description available.'}
          </Text>

          {/* Seller Info */}
          {selectedProduct.seller && (
            <>
              <View style={[styles.divider, { backgroundColor: GrayColors[200] }]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Seller</Text>
              <View style={styles.sellerRow}>
                <View
                  style={[
                    styles.sellerAvatar,
                    { backgroundColor: PrimaryColors.blue50 },
                  ]}
                >
                  {selectedProduct.seller.avatar_url ? (
                    <Image
                      source={{ uri: selectedProduct.seller.avatar_url }}
                      style={styles.sellerAvatarImage}
                    />
                  ) : (
                    <Text style={styles.sellerAvatarText}>
                      {(selectedProduct.seller.full_name || 'S').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={[styles.sellerName, { color: theme.text }]}>
                  {selectedProduct.seller.full_name || 'Seller'}
                </Text>
              </View>
            </>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: GrayColors[200] }]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                You May Also Like
              </Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ProductCardHorizontal
                    product={item}
                    onPress={() => handleRelatedProductPress(item.id)}
                  />
                )}
                style={styles.relatedList}
              />
            </>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOutOfStock && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
              borderTopColor: GrayColors[200],
            },
            Shadows.lg,
          ]}
        >
          {/* Quantity Selector */}
          <View style={styles.quantitySelector}>
            <Pressable
              style={[
                styles.quantityBtn,
                { backgroundColor: isDark ? Colors.dark.background : GrayColors[100] },
              ]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={quantity <= 1 ? GrayColors[300] : theme.text}
              />
            </Pressable>
            <Text style={[styles.quantityText, { color: theme.text }]}>{quantity}</Text>
            <Pressable
              style={[
                styles.quantityBtn,
                { backgroundColor: isDark ? Colors.dark.background : GrayColors[100] },
              ]}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= inventoryCount}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  quantity >= inventoryCount
                    ? GrayColors[300]
                    : theme.text
                }
              />
            </Pressable>
          </View>

          {/* Action Buttons */}
          <Pressable
            style={[
              styles.cartBtn,
              { borderColor: PrimaryColors.blue },
              cartSyncing && { opacity: 0.6 },
            ]}
            onPress={handleAddToCart}
            disabled={cartSyncing}
          >
            {cartSyncing ? (
              <ActivityIndicator size="small" color={PrimaryColors.blue} />
            ) : (
              <Ionicons name="cart-outline" size={24} color={PrimaryColors.blue} />
            )}
          </Pressable>
          <Pressable
            style={[
              styles.buyBtn,
              { backgroundColor: PrimaryColors.blue },
              cartSyncing && { opacity: 0.7 },
            ]}
            onPress={handleBuyNow}
            disabled={cartSyncing}
          >
            <Text style={styles.buyBtnText}>
              {cartSyncing ? 'Adding...' : 'Buy Now'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    position: 'relative',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePagination: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  contentSection: {
    padding: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: PrimaryColors.blue,
    fontWeight: '500',
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  ratingText: {
    ...Typography.body,
    fontWeight: '600',
  },
  reviewCount: {
    ...Typography.body,
  },
  price: {
    ...Typography.displayMedium,
    marginBottom: Spacing.md,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  stockText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    lineHeight: 24,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarText: {
    ...Typography.h4,
    color: PrimaryColors.blue,
  },
  sellerName: {
    ...Typography.body,
    fontWeight: '600',
  },
  relatedList: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...Typography.body,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '600',
  },
});
