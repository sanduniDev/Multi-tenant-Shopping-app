import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Colors,
  GrayColors,
  SemanticColors,
  Typography,
  Spacing,
  BorderRadius,
  PrimaryColors,
} from '@/constants/theme';

// List of countries
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile',
  'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
  'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

interface CountrySelectProps {
  value: string;
  onSelect: (country: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function CountrySelect({
  value,
  onSelect,
  label = 'Country',
  placeholder = 'Search country...',
  error,
}: CountrySelectProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const inputBackground = isDark ? theme.inputBackground : '#FFFFFF';
  const inputBorder = isDark ? theme.inputBorder : GrayColors[300];
  const dropdownBackground = isDark ? theme.cardBackground : '#FFFFFF';

  // Filter countries based on search text
  const filteredCountries = useMemo(() => {
    if (!searchText.trim()) {
      return COUNTRIES;
    }
    const query = searchText.toLowerCase();
    return COUNTRIES.filter((country) =>
      country.toLowerCase().includes(query)
    );
  }, [searchText]);

  const handleFocus = () => {
    setIsOpen(true);
    setSearchText(value); // Show current value in search
  };

  const handleBlur = () => {
    // Delay closing to allow tap on item
    setTimeout(() => {
      setIsOpen(false);
      setSearchText('');
    }, 200);
  };

  const handleSelect = (country: string) => {
    onSelect(country);
    setSearchText('');
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setSearchText('');
    onSelect('');
    inputRef.current?.focus();
  };

  const renderCountryItem = ({ item }: { item: string }) => (
    <Pressable
      style={[
        styles.countryItem,
        {
          backgroundColor: item === value ? (isDark ? PrimaryColors.blue900 : PrimaryColors.blue50) : 'transparent',
        },
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text
        style={[
          styles.countryText,
          {
            color: item === value ? PrimaryColors.blue : theme.text,
            fontWeight: item === value ? '600' : '400',
          },
        ]}
      >
        {item}
      </Text>
      {item === value && (
        <Ionicons name="checkmark" size={18} color={PrimaryColors.blue} />
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      {/* Selected Value / Search Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: inputBackground,
              borderColor: error ? SemanticColors.error : isOpen ? PrimaryColors.blue : inputBorder,
              color: theme.text,
            },
          ]}
          value={isOpen ? searchText : value}
          onChangeText={setSearchText}
          placeholder={isOpen ? placeholder : 'Select a country'}
          placeholderTextColor={theme.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="words"
        />
        <View style={styles.iconContainer}>
          {value && !isOpen ? (
            <Pressable onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={GrayColors[400]} />
            </Pressable>
          ) : (
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={GrayColors[400]}
            />
          )}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Dropdown */}
      {isOpen && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: dropdownBackground,
              borderColor: inputBorder,
            },
          ]}
        >
          {filteredCountries.length > 0 ? (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={renderCountryItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={styles.list}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No countries found
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    zIndex: 1000,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingRight: 40,
    ...Typography.body,
  },
  iconContainer: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: SemanticColors.error,
    marginTop: Spacing.xs,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  list: {
    maxHeight: 200,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  countryText: {
    ...Typography.body,
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
  },
});
