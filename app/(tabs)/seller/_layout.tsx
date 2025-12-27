import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SellerLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen
        name="add-product"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit-product"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
