import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
} from '@/constants/theme';
import { CartItemWithProduct } from '@/services/cart-service';
import { formatPrice } from '@/services/product-service';

interface CartItemCardProps {
  item: CartItemWithProduct;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
  onPress?: () => void;
  disabled?: boolean;
}

export function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  onPress,
  disabled = false,
}: CartItemCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardStyle = isDark ? CardStyles.dark : CardStyles.light;

  const product = item.product;
  const isOutOfStock = product.inventory_count === 0 || !product.is_active;
  const isLowStock = product.inventory_count !== null && product.inventory_count > 0 && product.inventory_count <= 5;
  const maxQuantity = Math.min(product.inventory_count || 0, 10);

  const handleIncrement = () => {
    if (item.quantity < maxQuantity) {
      onQuantityChange(item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.quantity - 1);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        cardStyle,
        { opacity: disabled ? 0.6 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
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
            <Ionicons name="image-outline" size={32} color={GrayColors[400]} />
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {product.title}
          </Text>
          <Pressable
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={GrayColors[400]} />
          </Pressable>
        </View>

        {/* Seller */}
        {product.seller && (
          <Text
            style={[styles.sellerText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            Sold by {product.seller.full_name || 'Seller'}
          </Text>
        )}

        {/* Stock Status */}
        {isOutOfStock ? (
          <Text style={[styles.stockWarning, { color: SemanticColors.error }]}>
            Currently unavailable
          </Text>
        ) : isLowStock ? (
          <Text style={[styles.stockWarning, { color: SemanticColors.warning }]}>
            Only {product.inventory_count} left
          </Text>
        ) : null}

        {/* Price and Quantity */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: PrimaryColors.blue }]}>
              {formatPrice(product.price)}
            </Text>
            <Text style={[styles.subtotal, { color: theme.textSecondary }]}>
              Total: {formatPrice(product.price * item.quantity)}
            </Text>
          </View>

          {/* Quantity Controls */}
          {!isOutOfStock && (
            <View style={styles.quantityContainer}>
              <Pressable
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: isDark ? Colors.dark.surfaceLight : GrayColors[100],
                    opacity: item.quantity <= 1 ? 0.5 : 1,
                  },
                ]}
                onPress={handleDecrement}
                disabled={item.quantity <= 1 || disabled}
              >
                <Ionicons name="remove" size={18} color={theme.text} />
              </Pressable>

              <Text style={[styles.quantityText, { color: theme.text }]}>
                {item.quantity}
              </Text>

              <Pressable
                style={[
                  styles.quantityButton,
                  {
                    backgroundColor: isDark ? Colors.dark.surfaceLight : GrayColors[100],
                    opacity: item.quantity >= maxQuantity ? 0.5 : 1,
                  },
                ]}
                onPress={handleIncrement}
                disabled={item.quantity >= maxQuantity || disabled}
              >
                <Ionicons name="add" size={18} color={theme.text} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Save for Later Button */}
        {onSaveForLater && !isOutOfStock && (
          <Pressable
            style={styles.saveForLaterButton}
            onPress={onSaveForLater}
          >
            <Ionicons name="heart-outline" size={16} color={PrimaryColors.blue} />
            <Text style={[styles.saveForLaterText, { color: PrimaryColors.blue }]}>
              Move to Wishlist
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  removeButton: {
    padding: 4,
  },
  sellerText: {
    ...Typography.caption,
    marginTop: 2,
  },
  stockWarning: {
    ...Typography.caption,
    fontWeight: '500',
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    ...Typography.body,
    fontWeight: '700',
  },
  subtotal: {
    ...Typography.caption,
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...Typography.body,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  saveForLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: GrayColors[200],
  },
  saveForLaterText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
