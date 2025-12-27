import { useEffect, useState } from 'react';
import { useTheme } from '@/context/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme } = useTheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // During SSR/static render return light to avoid hydration mismatch.
  if (!hasHydrated) {
    return 'light';
  }

  // After hydration use the app's theme context (respects saved preference).
  return colorScheme;
}
