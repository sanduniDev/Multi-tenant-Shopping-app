import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
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
  SemanticColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useProductStore } from '@/store/product-store';
import { formatPrice } from '@/services/product-service';

type StatCardIcon = keyof typeof Ionicons.glyphMap;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: StatCardIcon;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, bgColor, onPress }: StatCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      style={[
        styles.statCard,
        {
          backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
        },
        Shadows.sm,
      ]}
      onPress={onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
    </Pressable>
  );
}

interface QuickActionProps {
  title: string;
  icon: StatCardIcon;
  onPress: () => void;
}

function QuickAction({ title, icon, onPress }: QuickActionProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      style={[
        styles.quickAction,
        {
          backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
        },
        Shadows.sm,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={24} color={PrimaryColors.blue} />
      </View>
      <Text style={[styles.quickActionText, { color: theme.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function SellerDashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { user, profile } = useAuthStore();
  const { stats, statsLoading, fetchStats } = useProductStore();

  const loadStats = useCallback(() => {
    if (user?.id) {
      fetchStats(user.id);
    }
  }, [user?.id, fetchStats]);

  // Refetch stats every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleAddProduct = () => {
    router.push('/(tabs)/seller/add-product');
  };

  const handleViewProducts = () => {
    router.push('/(tabs)/seller/products');
  };

  const handleViewOrders = () => {
    router.push('/(tabs)/seller/orders');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={statsLoading} onRefresh={loadStats} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {profile?.full_name || 'Seller'}
            </Text>
          </View>
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: PrimaryColors.blue },
              Shadows.md,
            ]}
            onPress={handleAddProduct}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon="cube-outline"
            color={PrimaryColors.blue}
            bgColor={PrimaryColors.blue50}
            onPress={handleViewProducts}
          />
          <StatCard
            title="Active Listings"
            value={stats?.activeProducts || 0}
            icon="checkmark-circle-outline"
            color={SemanticColors.success}
            bgColor={SemanticColors.successBg}
            onPress={handleViewProducts}
          />
          <StatCard
            title="Out of Stock"
            value={stats?.outOfStock || 0}
            icon="alert-circle-outline"
            color={SemanticColors.warning}
            bgColor={SemanticColors.warningBg}
            onPress={handleViewProducts}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon="receipt-outline"
            color={SecondaryColors.indigo}
            bgColor="#EEF2FF"
            onPress={handleViewOrders}
          />
        </View>

        {/* Earnings Card */}
        <View
          style={[
            styles.earningsCard,
            {
              backgroundColor: isDark ? Colors.dark.surface : PrimaryColors.blue,
            },
          ]}
        >
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>
                {formatPrice(stats?.totalEarnings || 0)}
              </Text>
            </View>
            <View style={styles.earningsIcon}>
              <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.earningsFooter}>
            <Ionicons name="trending-up" size={16} color="#FFFFFF" />
            <Text style={styles.earningsHint}>
              {stats?.pendingOrders || 0} orders pending
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <QuickAction
              title="Add New Product"
              icon="add-circle-outline"
              onPress={handleAddProduct}
            />
            <QuickAction
              title="View All Products"
              icon="grid-outline"
              onPress={handleViewProducts}
            />
            <QuickAction
              title="Manage Orders"
              icon="clipboard-outline"
              onPress={handleViewOrders}
            />
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Seller Tips
          </Text>
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark ? Colors.dark.surface : SemanticColors.infoBg,
              },
            ]}
          >
            <Ionicons name="bulb-outline" size={24} color={SemanticColors.info} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>
                Add quality images
              </Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                Products with clear images sell 3x faster. Add up to 3 photos per product.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Import SecondaryColors
const SecondaryColors = {
  indigo: '#4F46E5',
};

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
    paddingBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.body,
  },
  name: {
    ...Typography.h2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    marginBottom: 2,
  },
  statTitle: {
    ...Typography.bodySmall,
  },
  earningsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  earningsLabel: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  earningsValue: {
    ...Typography.displayMedium,
    color: '#FFFFFF',
  },
  earningsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsHint: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  quickActions: {
    gap: Spacing.md,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: PrimaryColors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickActionText: {
    ...Typography.body,
    fontWeight: '500',
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    ...Typography.caption,
  },
});
