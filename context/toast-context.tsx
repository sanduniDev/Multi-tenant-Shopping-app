import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PrimaryColors,
  GrayColors,
  SemanticColors,
  BorderRadius,
  Spacing,
  Shadows,
  Typography,
} from '@/constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (config: ToastConfig) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If a toast is already visible, hide it first
      if (visible) {
        hideToast();
        setTimeout(() => {
          showNewToast(config);
        }, 350);
      } else {
        showNewToast(config);
      }
    },
    [visible, hideToast]
  );

  const showNewToast = (config: ToastConfig) => {
    setToast(config);
    setVisible(true);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const duration = config.duration || 4000;
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: SemanticColors.success,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: SemanticColors.error,
          icon: 'close-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: SemanticColors.warning,
          icon: 'warning' as const,
        };
      case 'info':
        return {
          backgroundColor: PrimaryColors.blue,
          icon: 'information-circle' as const,
        };
      default:
        return {
          backgroundColor: GrayColors[800],
          icon: 'information-circle' as const,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {visible && toast && (
        <Animated.View
          testID="toast-container"
          style={[
            styles.container,
            {
              top: insets.top + Spacing.md,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View
            style={[
              styles.toast,
              { backgroundColor: getToastStyles(toast.type).backgroundColor },
              Shadows.lg,
            ]}
          >
            <Ionicons
              name={getToastStyles(toast.type).icon}
              size={24}
              color="#FFFFFF"
              style={styles.icon}
            />
            <Text testID="toast-message" style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.action && (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  hideToast();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>{toast.action.label}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={hideToast}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
  },
  icon: {
    marginRight: Spacing.md,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  closeButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
});

export default ToastProvider;
