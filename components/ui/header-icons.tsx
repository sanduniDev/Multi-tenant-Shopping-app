import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

interface BadgeProps {
  count: number;
  size?: 'small' | 'medium';
}

function Badge({ count, size = 'small' }: BadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isSmall ? styles.badgeTextSmall : styles.badgeTextMedium,
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
}

interface HeaderIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
  color?: string;
}

export function HeaderIconButton({
  icon,
  onPress,
  badge = 0,
  color,
}: HeaderIconButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      style={[
        styles.iconButton,
        { backgroundColor: isDark ? Colors.dark.surfaceLight : GrayColors[100] },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={color || theme.text}
      />
      <Badge count={badge} />
    </Pressable>
  );
}

interface CartIconProps {
  color?: string;
}

export function CartIcon({ color }: CartIconProps) {
  const { user } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();

  useEffect(() => {
    if (user?.id) {
      fetchCart(user.id);
    }
  }, [user?.id]);

  const handlePress = () => {
    router.push('/cart');
  };

  return (
    <HeaderIconButton
      icon="cart-outline"
      onPress={handlePress}
      badge={totalQuantity}
      color={color}
    />
  );
}

interface WishlistIconProps {
  color?: string;
}

export function WishlistIcon({ color }: WishlistIconProps) {
  const { user } = useAuthStore();
  const { itemCount, fetchProductIds } = useWishlistStore();

  useEffect(() => {
    if (user?.id) {
      fetchProductIds(user.id);
    }
  }, [user?.id]);

  const handlePress = () => {
    router.push('/wishlist');
  };

  return (
    <HeaderIconButton
      icon="heart-outline"
      onPress={handlePress}
      badge={itemCount}
      color={color}
    />
  );
}

interface HeaderActionsProps {
  showCart?: boolean;
  showWishlist?: boolean;
  showNotifications?: boolean;
}

export function HeaderActions({
  showCart = true,
  showWishlist = true,
  showNotifications = false,
}: HeaderActionsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.actionsContainer}>
      {showWishlist && <WishlistIcon />}
      {showCart && <CartIcon />}
      {showNotifications && (
        <HeaderIconButton
          icon="notifications-outline"
          onPress={() => {
            // TODO: Navigate to notifications
          }}
          badge={0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    backgroundColor: PrimaryColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSmall: {
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  badgeMedium: {
    top: 2,
    right: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  badgeTextMedium: {
    fontSize: 12,
  },
});
