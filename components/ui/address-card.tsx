import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '@/types/database';
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
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AddressCardProps {
  address: Address;
  selected?: boolean;
  selectable?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
}

export function AddressCard({
  address,
  selected = false,
  selectable = false,
  onPress,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = true,
}: AddressCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
      borderColor: selected ? PrimaryColors.blue : theme.cardBorder,
      borderWidth: selected ? 2 : 1,
    },
    selected && styles.selectedCard,
  ];

  return (
    <Pressable
      style={cardStyle}
      onPress={onPress}
      disabled={!selectable && !onPress}
    >
      {/* Selection indicator */}
      {selectable && (
        <View style={styles.selectionIndicator}>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor: selected ? PrimaryColors.blue : GrayColors[400],
              },
            ]}
          >
            {selected && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: PrimaryColors.blue },
                ]}
              />
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, selectable && styles.contentWithRadio]}>
        {/* Header with name and default badge */}
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]}>
            {address.full_name}
          </Text>
          {address.is_default && (
            <View style={[styles.defaultBadge, { backgroundColor: PrimaryColors.blue50 }]}>
              <Text style={[styles.defaultText, { color: PrimaryColors.blue }]}>
                Default
              </Text>
            </View>
          )}
        </View>

        {/* Phone */}
        <View style={styles.row}>
          <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.phone, { color: theme.textSecondary }]}>
            {address.phone}
          </Text>
        </View>

        {/* Address lines */}
        <Text style={[styles.addressLine, { color: theme.text }]}>
          {address.address_line1}
        </Text>
        {address.address_line2 && (
          <Text style={[styles.addressLine, { color: theme.text }]}>
            {address.address_line2}
          </Text>
        )}
        <Text style={[styles.addressLine, { color: theme.text }]}>
          {address.city}, {address.state} {address.postal_code}
        </Text>
        <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
          {address.country}
        </Text>

        {/* Action buttons */}
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: PrimaryColors.blue50 }]}
                onPress={onEdit}
              >
                <Ionicons name="pencil-outline" size={16} color={PrimaryColors.blue} />
                <Text style={[styles.actionText, { color: PrimaryColors.blue }]}>
                  Edit
                </Text>
              </Pressable>
            )}

            {onSetDefault && !address.is_default && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: GrayColors[100] }]}
                onPress={onSetDefault}
              >
                <Ionicons name="star-outline" size={16} color={GrayColors[600]} />
                <Text style={[styles.actionText, { color: GrayColors[600] }]}>
                  Set Default
                </Text>
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: SemanticColors.errorBg }]}
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={16} color={SemanticColors.error} />
                <Text style={[styles.actionText, { color: SemanticColors.error }]}>
                  Delete
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    ...Shadows.sm,
  },
  selectedCard: {
    ...Shadows.md,
  },
  selectionIndicator: {
    marginRight: Spacing.md,
    justifyContent: 'flex-start',
    paddingTop: Spacing.xs,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  content: {
    flex: 1,
  },
  contentWithRadio: {
    paddingRight: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    ...Typography.h4,
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  phone: {
    ...Typography.bodySmall,
  },
  addressLine: {
    ...Typography.body,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});

export default AddressCard;
