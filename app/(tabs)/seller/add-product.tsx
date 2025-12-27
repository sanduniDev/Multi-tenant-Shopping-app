import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useProductStore } from '@/store/product-store';
import { uploadProductImages } from '@/services/product-service';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePickerMulti } from '@/components/ui/image-picker';
import { Category } from '@/types/database';

interface FormErrors {
  title?: string;
  price?: string;
  inventory?: string;
  category?: string;
}

export default function AddProductScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const { user } = useAuthStore();
  const { categories, fetchCategories, addProduct, loading } = useProductStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Product title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!inventory.trim()) {
      newErrors.inventory = 'Inventory count is required';
    } else if (isNaN(parseInt(inventory)) || parseInt(inventory) < 0) {
      newErrors.inventory = 'Please enter a valid inventory count';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      showToast({ message: 'Please sign in again', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      // Upload images first
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        const { urls, errors: uploadErrors } = await uploadProductImages(user.id, images);
        uploadedImageUrls = urls;

        if (uploadErrors.length > 0) {
          showToast({
            message: `${uploadErrors.length} image(s) failed to upload`,
            type: 'warning',
          });
        }
      }

      // Create product
      const { success, error } = await addProduct(user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        inventory_count: parseInt(inventory),
        category_id: selectedCategory || undefined,
        images: uploadedImageUrls,
      });

      if (success) {
        showToast({ message: 'Product added successfully!', type: 'success' });
        router.back();
      } else {
        showToast({ message: error || 'Failed to add product', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Something went wrong', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Product Images
            </Text>
            <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
              Add up to 3 images. First image will be the cover.
            </Text>
            <ImagePickerMulti
              images={images}
              onImagesChange={setImages}
              maxImages={3}
            />
          </View>

          {/* Product Details */}
          <View style={[styles.section, { zIndex: 10 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Product Details
            </Text>

            <Input
              label="Product Title"
              placeholder="Enter product name"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              leftIcon="pricetag-outline"
            />

            {/* Description - Custom TextArea */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>
                Description (Optional)
              </Text>
              <View
                style={[
                  styles.textAreaContainer,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={GrayColors[400]}
                  style={styles.textAreaIcon}
                />
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Describe your product"
                  placeholderTextColor={GrayColors[400]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Category Picker */}
            <View style={[styles.inputGroup, { zIndex: 1000 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Category</Text>
              <Pressable
                style={[
                  styles.categoryPicker,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: errors.category ? '#DC2626' : theme.inputBorder,
                  },
                ]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={selectedCategory ? PrimaryColors.blue : GrayColors[400]}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selectedCategory ? theme.text : GrayColors[400],
                    },
                  ]}
                >
                  {selectedCategoryName || 'Select a category'}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={GrayColors[400]}
                />
              </Pressable>

              {/* Category Dropdown */}
              {showCategoryPicker && (
                <View
                  style={[
                    styles.categoryDropdown,
                    {
                      backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? GrayColors[600] : GrayColors[200],
                    },
                    Shadows.lg,
                  ]}
                >
                  <ScrollView
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          selectedCategory === category.id && {
                            backgroundColor: PrimaryColors.blue50,
                          },
                        ]}
                        onPress={() => {
                          setSelectedCategory(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            {
                              color:
                                selectedCategory === category.id
                                  ? PrimaryColors.blue
                                  : theme.text,
                            },
                          ]}
                        >
                          {category.name}
                        </Text>
                        {selectedCategory === category.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={PrimaryColors.blue}
                          />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Pricing & Inventory */}
          <View style={[styles.section, { zIndex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Pricing & Inventory
            </Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Price (Rs.)"
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  error={errors.price}
                  leftIcon="cash-outline"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Stock Quantity"
                  placeholder="0"
                  value={inventory}
                  onChangeText={setInventory}
                  keyboardType="number-pad"
                  error={errors.inventory}
                  leftIcon="cube-outline"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Button
              onPress={handleSubmit}
              loading={submitting || loading}
              disabled={submitting || loading}
              size="large"
            >
              Add Product
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: GrayColors[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textAreaContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 120,
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    ...Typography.body,
    minHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    minHeight: 52,
  },
  categoryText: {
    flex: 1,
    ...Typography.body,
  },
  categoryDropdown: {
    position: 'absolute',
    top: 82,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  categoryOptionText: {
    ...Typography.body,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    marginTop: Spacing.xl,
  },
});
