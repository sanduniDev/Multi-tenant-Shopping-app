import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/context/toast-context';
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
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { WishlistItemWithProduct } from '@/services/wishlist-service';
import { formatPrice } from '@/services/product-service';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

interface WishlistCardProps {
  item: WishlistItemWithProduct;
  onPress: () => void;
  onRemove: () => void;
  onAddToCart: () => void;
}

function WishlistCard({ item, onPress, onRemove, onAddToCart }: WishlistCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardStyle = isDark ? CardStyles.dark : CardStyles.light;

  const product = item.product;
  const isOutOfStock = product.inventory_count === 0 || !product.is_active;

  return (
    <Pressable
      style={[
        styles.card,
        cardStyle,
        { width: CARD_WIDTH },
      ]}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: GrayColors[100] }]}>
            <Ionicons name="image-outline" size={40} color={GrayColors[400]} />
          </View>
        )}

        {/* Remove Button */}
        <Pressable
          style={[
            styles.removeButton,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' },
          ]}
          onPress={onRemove}
        >
          <Ionicons name="heart" size={18} color="#EF4444" />
        </Pressable>

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={2}
        >
          {product.title}
        </Text>

        {/* Rating */}
        {product.review_count > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
              {product.average_rating?.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: GrayColors[400] }]}>
              ({product.review_count})
            </Text>
          </View>
        )}

        {/* Price */}
        <Text style={[styles.price, { color: PrimaryColors.blue }]}>
          {formatPrice(product.price)}
        </Text>

        {/* Add to Cart Button */}
        <Pressable
          style={[
            styles.addToCartButton,
            {
              backgroundColor: isOutOfStock ? GrayColors[300] : PrimaryColors.blue,
            },
          ]}
          onPress={onAddToCart}
          disabled={isOutOfStock}
        >
          <Ionicons
            name="cart-outline"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.addToCartText}>
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function WishlistScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const { user } = useAuthStore();
  const {
    items,
    loading,
    syncing,
    error,
    fetchWishlist,
    removeItem,
    clear,
  } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  // Fetch wishlist on focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchWishlist(user.id);
      }
    }, [user?.id, fetchWishlist])
  );

  const handleRemoveItem = (productId: string, productTitle: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove "${productTitle}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => user?.id && removeItem(user.id, productId),
        },
      ]
    );
  };

  const handleAddToCart = async (productId: string) => {
    if (!user?.id) return;

    const success = await addToCart(user.id, productId, 1);
    if (success) {
      await removeItem(user.id, productId);
      showToast({ message: 'Added to cart', type: 'success' });
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleClearWishlist = () => {
    if (!user?.id) return;

    // For web, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Remove all items from your wishlist?');
      if (confirmed) {
        clear(user.id).then((success) => {
          if (!success) {
            window.alert('Failed to clear wishlist');
          }
        });
      }
    } else {
      Alert.alert(
        'Clear Wishlist',
        'Remove all items from your wishlist?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              const success = await clear(user.id);
              if (!success) {
                Alert.alert('Error', 'Failed to clear wishlist');
              }
            },
          },
        ]
      );
    }
  };

  const handleStartShopping = () => {
    router.push('/(tabs)/explore');
  };

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;

  // Empty wishlist state
  if (!loading && items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Wishlist</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: PrimaryColors.blue50 }]}>
            <Ionicons name="heart-outline" size={64} color={PrimaryColors.blue} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Your wishlist is empty
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Save items you love by tapping the heart icon
          </Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: PrimaryColors.blue }]}
            onPress={handleStartShopping}
          >
            <Text style={styles.emptyButtonText}>Explore Products</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Wishlist ({items.length})
        </Text>
        {items.length > 0 && (
          <Pressable onPress={handleClearWishlist} style={styles.clearButton}>
            <Text style={{ color: SemanticColors.error }}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: SemanticColors.errorBg }]}>
          <Ionicons name="warning" size={20} color={SemanticColors.error} />
          <Text style={[styles.errorText, { color: SemanticColors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Wishlist Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => user?.id && fetchWishlist(user.id)}
            tintColor={PrimaryColors.blue}
          />
        }
        renderItem={({ item }) => (
          <WishlistCard
            item={item}
            onPress={() => handleProductPress(item.product_id)}
            onRemove={() => handleRemoveItem(item.product_id, item.product.title)}
            onAddToCart={() => handleAddToCart(item.product_id)}
          />
        )}
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
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerRight: {
    width: 40,
  },
  clearButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Card Styles
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  outOfStockText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoContainer: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  reviewCount: {
    ...Typography.caption,
  },
  price: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addToCartText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
