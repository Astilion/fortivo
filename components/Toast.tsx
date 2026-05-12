import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import colors from '@/constants/Colors';
import { useToastStore } from '@/store/toastStore';

const SLIDE_OFFSET = 120;
const DISMISS_AFTER = 1500;

type ToastType = 'error' | 'success' | 'info';

export function Toast() {
  const { message, type, hideToast } = useToastStore();
  const slideAnim = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const [displayType, setDisplayType] = useState<ToastType>('info');

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(slideAnim, {
      toValue: SLIDE_OFFSET,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      hideToast();
      setDisplayMessage(null);
    });
  }, [hideToast, slideAnim]);

  useEffect(() => {
    if (!message) return;

    setDisplayMessage(message);
    setDisplayType(type);
    slideAnim.setValue(SLIDE_OFFSET);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, DISMISS_AFTER);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message]);

  const backgroundColor =
    displayType === 'error'
      ? colors.danger
      : displayType === 'success'
        ? colors.accent
        : colors.secondary;

  const textColor =
    displayType === 'success' ? colors.primary : colors.text.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={displayMessage ? 'auto' : 'none'}
      accessibilityRole='alert'
      accessibilityLiveRegion='assertive'
    >
      {displayMessage && (
        <Text style={[styles.message, { color: textColor }]}>
          {displayMessage}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
