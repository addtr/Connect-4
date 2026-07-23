// Simple themed pressable button used across menus and screens.

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

function Button({ title, onPress, theme, variant = 'primary', style }) {
  const bg =
    variant === 'primary'
      ? theme.accent
      : variant === 'ghost'
      ? 'transparent'
      : theme.boardColor;
  const borderColor = variant === 'ghost' ? theme.textMuted : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor, opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
    </Pressable>
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
