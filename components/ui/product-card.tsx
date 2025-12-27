import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
  CardStyles,
} from '@/constants/theme';
import { ProductWithDetails } from '@/services/browse-service';
import { formatPrice } from '@/services/product-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

// Animated Wishlist Button Component
interface WishlistButtonProps {
  isWishlisted: boolean;
  onPress: () => void;
  size?: number;
  style?: any;
  backgroundColor?: string;
}

function WishlistButton({ isWishlisted, onPress, size = 18, style, backgroundColor }: WishlistButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Animate scale
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Pressable style={style} onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isWishlisted ? 'heart' : 'heart-outline'}
          size={size}
          color={isWishlisted ? '#EF4444' : GrayColors[500]}
        />
      </Animated.View>
    </Pressable>
  );
}

interface ProductCardProps {
  product: ProductWithDetails;
  viewMode?: 'grid' | 'list';
  onPress: () => void;
  onWishlistPress?: () => void;
  isWishlisted?: boolean;
}

export function ProductCard({
  product,
  viewMode = 'grid',
  onPress,
  onWishlistPress,
  isWishlisted = false,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const hasDiscount = false; // For future discount feature
  const originalPrice = product.price;

  if (viewMode === 'list') {
    const cardStyle = isDark ? CardStyles.dark : CardStyles.light;
    return (
      <Pressable
        style={[
          styles.listCard,
          cardStyle,
        ]}
        onPress={onPress}
      >
        {/* Product Image */}
        <View style={styles.listImageContainer}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.listImagePlaceholder, { backgroundColor: GrayColors[100] }]}>
              <Ionicons name="image-outline" size={32} color={GrayColors[400]} />
            </View>
          )}
          {product.inventory_count <= 5 && product.inventory_count > 0 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.listInfo}>
          <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>
            {product.title}
          </Text>

          {/* Rating */}
          {product.review_count > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                {product.average_rating?.toFixed(1)} ({product.review_count})
              </Text>
            </View>
          )}

          {/* Category */}
          {product.category && (
            <Text style={[styles.categoryText, { color: theme.textSecondary }]} numberOfLines={1}>
              {product.category.name}
            </Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.listPrice, { color: PrimaryColors.blue }]}>
              {formatPrice(product.price)}
            </Text>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: GrayColors[400] }]}>
                {formatPrice(originalPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Wishlist Button */}
        {onWishlistPress && (
          <WishlistButton
            isWishlisted={isWishlisted}
            onPress={onWishlistPress}
            size={22}
            style={styles.listWishlistBtn}
          />
        )}
      </Pressable>
    );
  }

  // Grid View
  const cardStyle = isDark ? CardStyles.dark : CardStyles.light;
  return (
    <Pressable
      style={[
        styles.gridCard,
        cardStyle,
        { width: GRID_CARD_WIDTH },
      ]}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.gridImageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gridImagePlaceholder, { backgroundColor: GrayColors[100] }]}>
            <Ionicons name="image-outline" size={40} color={GrayColors[400]} />
          </View>
        )}

        {/* Wishlist Button */}
        {onWishlistPress && (
          <WishlistButton
            isWishlisted={isWishlisted}
            onPress={onWishlistPress}
            size={18}
            style={[
              styles.gridWishlistBtn,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' },
            ]}
          />
        )}

        {/* Low Stock Badge */}
        {product.inventory_count <= 5 && product.inventory_count > 0 && (
          <View style={styles.gridLowStockBadge}>
            <Text style={styles.lowStockText}>Low Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.gridInfo}>
        <Text style={[styles.gridTitle, { color: theme.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Rating */}
        {product.review_count > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingTextSmall, { color: theme.textSecondary }]}>
              {product.average_rating?.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: GrayColors[400] }]}>
              ({product.review_count})
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.gridPriceContainer}>
          <Text style={[styles.gridPrice, { color: PrimaryColors.blue }]}>
            {formatPrice(product.price)}
          </Text>
          {hasDiscount && (
            <Text style={[styles.gridOriginalPrice, { color: GrayColors[400] }]}>
              {formatPrice(originalPrice)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Horizontal scrollable product card for home screen sections
export function ProductCardHorizontal({
  product,
  onPress,
  onWishlistPress,
  isWishlisted = false,
}: Omit<ProductCardProps, 'viewMode'>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardStyle = isDark ? CardStyles.dark : CardStyles.light;

  return (
    <Pressable
      style={[
        styles.horizontalCard,
        cardStyle,
      ]}
      onPress={onPress}
    >
      {/* Product Image */}
      <View style={styles.horizontalImageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image
            source={{ uri: product.images[0] }}
            style={styles.horizontalImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.horizontalImagePlaceholder, { backgroundColor: GrayColors[100] }]}>
            <Ionicons name="image-outline" size={32} color={GrayColors[400]} />
          </View>
        )}

        {/* Wishlist Button */}
        {onWishlistPress && (
          <WishlistButton
            isWishlisted={isWishlisted}
            onPress={onWishlistPress}
            size={16}
            style={[
              styles.gridWishlistBtn,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' },
            ]}
          />
        )}
      </View>

      {/* Product Info */}
      <View style={styles.horizontalInfo}>
        <Text style={[styles.horizontalTitle, { color: theme.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Rating */}
        {product.review_count > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingTextSmall, { color: theme.textSecondary }]}>
              {product.average_rating?.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Price */}
        <Text style={[styles.horizontalPrice, { color: PrimaryColors.blue }]}>
          {formatPrice(product.price)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Grid Card Styles
  gridCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridWishlistBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLowStockBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  gridInfo: {
    padding: Spacing.md,
  },
  gridTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 40,
  },
  gridPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  gridPrice: {
    ...Typography.body,
    fontWeight: '700',
  },
  gridOriginalPrice: {
    ...Typography.caption,
    textDecorationLine: 'line-through',
  },

  // List Card Styles
  listCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  listImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  listTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  listPrice: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  listWishlistBtn: {
    justifyContent: 'center',
    paddingLeft: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  originalPrice: {
    ...Typography.bodySmall,
    textDecorationLine: 'line-through',
  },
  categoryText: {
    ...Typography.caption,
    marginTop: 2,
  },

  // Shared Styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    ...Typography.bodySmall,
  },
  ratingTextSmall: {
    ...Typography.caption,
    fontWeight: '500',
  },
  reviewCount: {
    ...Typography.caption,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  lowStockText: {
    ...Typography.caption,
    color: '#92400E',
    fontWeight: '500',
  },

  // Horizontal Card Styles (for home sections)
  horizontalCard: {
    width: 150,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  horizontalImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalInfo: {
    padding: Spacing.sm,
  },
  horizontalTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 32,
  },
  horizontalPrice: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginTop: 4,
  },
});
