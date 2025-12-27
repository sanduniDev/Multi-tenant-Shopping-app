import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
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

interface FormErrors {
  title?: string;
  price?: string;
  inventory?: string;
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const { user } = useAuthStore();
  const {
    selectedProduct,
    categories,
    loading,
    fetchProduct,
    fetchCategories,
    editProduct,
    clearSelectedProduct,
  } = useProductStore();

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
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      if (id) {
        await fetchProduct(id);
      }
      setInitialLoading(false);
    };
    loadData();

    return () => {
      clearSelectedProduct();
    };
  }, [id]);

  // Populate form when product loads
  useEffect(() => {
    if (selectedProduct) {
      setTitle(selectedProduct.title || '');
      setDescription(selectedProduct.description || '');
      setPrice(selectedProduct.price?.toString() || '');
      setInventory(selectedProduct.inventory_count?.toString() || '');
      setSelectedCategory(selectedProduct.category_id || null);
      setImages(selectedProduct.images || []);
    }
  }, [selectedProduct]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Product title is required';
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
    if (!user?.id || !id) {
      showToast({ message: 'Please sign in again', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      // Separate new local images from existing URLs
      const existingImages = images.filter((img) => img.startsWith('http'));
      const newImages = images.filter((img) => !img.startsWith('http'));

      let uploadedImageUrls: string[] = [...existingImages];

      // Upload new images
      if (newImages.length > 0) {
        const { urls, errors: uploadErrors } = await uploadProductImages(
          user.id,
          newImages
        );
        uploadedImageUrls = [...existingImages, ...urls];

        if (uploadErrors.length > 0) {
          showToast({
            message: `${uploadErrors.length} image(s) failed to upload`,
            type: 'warning',
          });
        }
      }

      // Update product
      const { success, error } = await editProduct(id, user.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        inventory_count: parseInt(inventory),
        category_id: selectedCategory || undefined,
        images: uploadedImageUrls,
      });

      if (success) {
        showToast({ message: 'Product updated successfully!', type: 'success' });
        router.back();
      } else {
        showToast({ message: error || 'Failed to update product', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Something went wrong', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedProduct) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={GrayColors[300]} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Product not found
          </Text>
          <Button onPress={() => router.back()} variant="outline" size="medium">
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Product</Text>
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
                    borderColor: theme.inputBorder,
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
              Save Changes
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
    textAlign: 'center',
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
    zIndex: 100,
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
