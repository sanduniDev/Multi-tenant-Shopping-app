import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  SemanticColors,
  Typography,
  Spacing,
  BorderRadius,
  Backgrounds,
  Shadows,
} from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useAddressStore } from '@/store/address-store';
import { validateAddress, AddressUpdate, getAddressById } from '@/services/address-service';
import { Button } from '@/components/ui/button';
import { CountrySelect } from '@/components/ui/country-select';

export default function EditAddressScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { updateExistingAddress, syncing } = useAddressStore();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<AddressUpdate>>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const screenBackground = isDark ? Backgrounds.dark.primary : Backgrounds.light.primary;
  const inputBackground = isDark ? theme.inputBackground : '#FFFFFF';
  const inputBorder = isDark ? theme.inputBorder : GrayColors[300];

  // Load address data
  useEffect(() => {
    const loadAddress = async () => {
      if (!id) {
        router.back();
        return;
      }

      const { data, error } = await getAddressById(id);
      if (error || !data) {
        router.back();
        return;
      }

      setFormData({
        full_name: data.full_name,
        phone: data.phone,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || '',
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
        is_default: data.is_default || false,
      });
      setLoading(false);
    };

    loadAddress();
  }, [id]);

  const handleChange = (field: keyof AddressUpdate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !id) return;

    // Validate form
    const validation = validateAddress(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Update address
    const addressData: AddressUpdate = {
      full_name: formData.full_name?.trim(),
      phone: formData.phone?.trim(),
      address_line1: formData.address_line1?.trim(),
      address_line2: formData.address_line2?.trim() || null,
      city: formData.city?.trim(),
      state: formData.state?.trim(),
      postal_code: formData.postal_code?.trim(),
      country: formData.country?.trim(),
      is_default: formData.is_default,
    };

    const success = await updateExistingAddress(id, user.id, addressData);
    if (success) {
      router.back();
    }
  };

  const renderInput = (
    field: keyof AddressUpdate,
    label: string,
    options: {
      placeholder?: string;
      multiline?: boolean;
      keyboardType?: 'default' | 'phone-pad' | 'email-address';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    } = {}
  ) => {
    const error = errors[field];
    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBackground,
              borderColor: error ? SemanticColors.error : inputBorder,
              color: theme.text,
            },
            options.multiline && styles.multilineInput,
          ]}
          value={formData[field] as string}
          onChangeText={(value) => handleChange(field, value)}
          placeholder={options.placeholder || label}
          placeholderTextColor={theme.placeholder}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'words'}
          multiline={options.multiline}
          numberOfLines={options.multiline ? 3 : 1}
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PrimaryColors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBackground }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Edit Address
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                borderColor: theme.cardBorder,
              },
              Shadows.sm,
            ]}
          >
            {/* Contact Information */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contact Information
            </Text>

            {renderInput('full_name', 'Full Name', {
              placeholder: 'John Doe',
            })}

            {renderInput('phone', 'Phone Number', {
              placeholder: '+1 (555) 123-4567',
              keyboardType: 'phone-pad',
              autoCapitalize: 'none',
            })}

            {/* Address */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>
              Address
            </Text>

            {renderInput('address_line1', 'Street Address', {
              placeholder: '123 Main Street',
            })}

            {renderInput('address_line2', 'Apt, Suite, Building (Optional)', {
              placeholder: 'Apt 4B',
            })}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                {renderInput('city', 'City', {
                  placeholder: 'New York',
                })}
              </View>
              <View style={styles.halfInput}>
                {renderInput('state', 'State', {
                  placeholder: 'NY',
                })}
              </View>
            </View>

            {renderInput('postal_code', 'Postal Code', {
              placeholder: '10001',
              keyboardType: 'default',
              autoCapitalize: 'characters',
            })}

            <CountrySelect
              value={formData.country || ''}
              onSelect={(country) => handleChange('country', country)}
              error={errors.country}
            />

            {/* Set as Default */}
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Ionicons
                  name="star-outline"
                  size={20}
                  color={formData.is_default ? PrimaryColors.blue : theme.textSecondary}
                />
                <Text style={[styles.switchLabel, { color: theme.text }]}>
                  Set as default address
                </Text>
              </View>
              <Switch
                value={formData.is_default}
                onValueChange={(value) => handleChange('is_default', value)}
                trackColor={{ false: GrayColors[300], true: PrimaryColors.blue200 }}
                thumbColor={formData.is_default ? PrimaryColors.blue : GrayColors[100]}
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleSubmit}
              loading={syncing}
              disabled={syncing}
            >
              Update Address
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
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    ...Typography.caption,
    color: SemanticColors.error,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: GrayColors[200],
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  switchLabel: {
    ...Typography.body,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
