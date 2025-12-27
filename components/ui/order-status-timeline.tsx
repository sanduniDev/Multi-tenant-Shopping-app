import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
} from '@/constants/theme';
import { OrderStatus, formatOrderDate, formatOrderTime } from '@/services/order-service';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  timestamp?: string;
}

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  compact?: boolean;
}

const TIMELINE_STEPS: Omit<TimelineStep, 'timestamp'>[] = [
  { status: 'pending', label: 'Order Placed', icon: 'receipt-outline' },
  { status: 'processing', label: 'Processing', icon: 'cube-outline' },
  { status: 'shipped', label: 'Shipped', icon: 'airplane-outline' },
  { status: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export function OrderStatusTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  compact = false,
}: OrderStatusTimelineProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  // Handle cancelled status separately
  if (currentStatus === 'cancelled') {
    return (
      <View style={[styles.cancelledContainer, { backgroundColor: SemanticColors.errorBg }]}>
        <Ionicons name="close-circle" size={24} color={SemanticColors.error} />
        <View style={styles.cancelledContent}>
          <Text style={[styles.cancelledTitle, { color: SemanticColors.error }]}>
            Order Cancelled
          </Text>
          {updatedAt && (
            <Text style={[styles.cancelledDate, { color: theme.textSecondary }]}>
              {formatOrderDate(updatedAt)} at {formatOrderTime(updatedAt)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepColor = (stepStatus: 'completed' | 'current' | 'upcoming') => {
    switch (stepStatus) {
      case 'completed':
        return SemanticColors.success;
      case 'current':
        return PrimaryColors.blue;
      default:
        return GrayColors[300];
    }
  };

  const getStepBgColor = (stepStatus: 'completed' | 'current' | 'upcoming') => {
    switch (stepStatus) {
      case 'completed':
        return SemanticColors.successBg;
      case 'current':
        return PrimaryColors.blue50;
      default:
        return isDark ? GrayColors[700] : GrayColors[100];
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const color = getStepColor(stepStatus);
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <React.Fragment key={step.status}>
              <View
                style={[
                  styles.compactDot,
                  {
                    backgroundColor: stepStatus === 'upcoming' ? 'transparent' : color,
                    borderColor: color,
                  },
                ]}
              >
                {stepStatus === 'completed' && (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.compactLine,
                    {
                      backgroundColor:
                        stepStatus !== 'upcoming' && getStepStatus(index + 1) !== 'upcoming'
                          ? SemanticColors.success
                          : GrayColors[300],
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {TIMELINE_STEPS.map((step, index) => {
        const stepStatus = getStepStatus(index);
        const color = getStepColor(stepStatus);
        const bgColor = getStepBgColor(stepStatus);
        const isLast = index === TIMELINE_STEPS.length - 1;

        // Determine timestamp
        let timestamp: string | undefined;
        if (step.status === 'pending') {
          timestamp = createdAt;
        } else if (stepStatus === 'current' || stepStatus === 'completed') {
          timestamp = updatedAt;
        }

        return (
          <View key={step.status} style={styles.stepContainer}>
            {/* Left side - icon and line */}
            <View style={styles.stepLeft}>
              <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                {stepStatus === 'completed' ? (
                  <Ionicons name="checkmark" size={20} color={color} />
                ) : (
                  <Ionicons name={step.icon} size={20} color={color} />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        stepStatus === 'completed' ? SemanticColors.success : GrayColors[300],
                    },
                  ]}
                />
              )}
            </View>

            {/* Right side - content */}
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: stepStatus === 'upcoming' ? GrayColors[400] : theme.text,
                    fontWeight: stepStatus === 'current' ? '600' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
              {timestamp && stepStatus !== 'upcoming' && (
                <Text style={[styles.stepDate, { color: theme.textSecondary }]}>
                  {formatOrderDate(timestamp)}
                  {stepStatus === 'current' && ` at ${formatOrderTime(timestamp)}`}
                </Text>
              )}
              {stepStatus === 'current' && (
                <View style={[styles.currentBadge, { backgroundColor: PrimaryColors.blue50 }]}>
                  <Text style={[styles.currentBadgeText, { color: PrimaryColors.blue }]}>
                    Current
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 64,
  },
  stepLeft: {
    alignItems: 'center',
    width: 48,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: Spacing.xs,
  },
  stepContent: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  stepLabel: {
    ...Typography.body,
    marginBottom: 2,
  },
  stepDate: {
    ...Typography.caption,
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  currentBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  cancelledContent: {
    flex: 1,
  },
  cancelledTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  cancelledDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  compactDot: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLine: {
    height: 2,
    width: 32,
    marginHorizontal: 4,
  },
});
