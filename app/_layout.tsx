import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';

// Suppress LogBox warnings in E2E tests (they block UI elements)
if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

import { useColorScheme, ThemeProvider } from '@/context/theme-context';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { PrimaryColors, Colors } from '@/constants/theme';
import { ToastProvider } from '@/context/toast-context';

// Custom theme based on BazaarX design system
const BazaarXLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: PrimaryColors.blue,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: PrimaryColors.blue,
  },
};

const BazaarXDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: PrimaryColors.blue,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: PrimaryColors.blue,
  },
};

function LoadingScreen() {
  // Don't use useColorScheme here - component renders before ThemeProvider
  const theme = Colors.light; // Always use light theme for loading screen

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={PrimaryColors.blue} />
    </View>
  );
}

export default function RootLayout() {
  const { initialize, setSession, loading, initialized } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Handle password recovery
      if (event === 'PASSWORD_RECOVERY') {
        // Navigate to reset password screen
        router.push('/(auth)/reset-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          {!initialized || loading ? (
            <LoadingScreen />
          ) : (
            <RootNavigator />
          )}
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme(); // Now safe to call inside ThemeProvider

  return (
    <NavigationThemeProvider
      value={colorScheme === 'dark' ? BazaarXDarkTheme : BazaarXLightTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="cart/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="wishlist/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
