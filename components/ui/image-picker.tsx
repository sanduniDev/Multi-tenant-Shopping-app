import React from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  PrimaryColors,
  GrayColors,
  BorderRadius,
  Spacing,
  Shadows,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MAX_IMAGES = 3;

interface ImagePickerMultiProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImagePickerMulti({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
}: ImagePickerMultiProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only add up to ${maxImages} images`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll access to add product images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImagesChange([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            onImagesChange(newImages);
          },
        },
      ]
    );
  };

  const moveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Existing Images */}
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />

            {/* First image badge */}
            {index === 0 && (
              <View style={styles.primaryBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
              </View>
            )}

            {/* Remove button */}
            <Pressable
              style={styles.removeButton}
              onPress={() => removeImage(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={PrimaryColors.blue} />
            </Pressable>

            {/* Reorder buttons */}
            <View style={styles.reorderButtons}>
              {index > 0 && (
                <Pressable
                  style={[styles.reorderBtn, { backgroundColor: theme.background }]}
                  onPress={() => moveImage(index, 'left')}
                >
                  <Ionicons name="chevron-back" size={16} color={theme.text} />
                </Pressable>
              )}
              {index < images.length - 1 && (
                <Pressable
                  style={[styles.reorderBtn, { backgroundColor: theme.background }]}
                  onPress={() => moveImage(index, 'right')}
                >
                  <Ionicons name="chevron-forward" size={16} color={theme.text} />
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <Pressable
            style={[
              styles.addButton,
              {
                backgroundColor: isDark ? Colors.dark.surface : GrayColors[50],
                borderColor: isDark ? GrayColors[600] : GrayColors[300],
              },
            ]}
            onPress={pickImage}
          >
            <Ionicons
              name="camera-outline"
              size={32}
              color={PrimaryColors.blue}
            />
            <View style={styles.addTextContainer}>
              <Ionicons name="add" size={16} color={PrimaryColors.blue} />
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Helper text */}
      <View style={styles.helperContainer}>
        <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
        <View style={styles.helperTextWrapper}>
          <Pressable>
            <Ionicons name="star" size={10} color={PrimaryColors.blue} />
          </Pressable>
          <View style={{ width: 4 }} />
          <View>
            <Ionicons name="arrow-forward" size={10} color={theme.textSecondary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: PrimaryColors.blue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  reorderBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTextContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: PrimaryColors.blue50,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  helperTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ImagePickerMulti;
