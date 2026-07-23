// Simple themed pressable button used across menus and screens. Plays a short
// tap sound (respecting the sound setting) and animates a subtle press scale.

import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useSettings } from '../state/SettingsContext';
import { playTap } from '../services/feedback';

function Button({ title, onPress, theme, variant = 'primary', style }) {
  const { soundEnabled } = useSettings();
  const scale = useRef(new Animated.Value(1)).current;

  const bg =
    variant === 'primary'
      ? theme.accent
      : variant === 'ghost'
      ? 'transparent'
      : theme.boardColor;
  const borderColor = variant === 'ghost' ? theme.textMuted : 'transparent';

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePress = () => {
    playTap(soundEnabled);
    onPress && onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bg, borderColor, opacity: pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 240,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Button;
