// A single disc/cell in the board grid.
//
// Two bits of motion live here:
//   - Drop animation: when a cell transitions from empty to filled, the disc
//     springs down from above its column and settles with a slight bounce.
//   - Winning highlight: winning cells run a looping glow/pulse so the four
//     connecting pieces are unmistakable.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import { EMPTY } from '../logic/constants';
import { playerColors } from '../theme/themes';

function Disc({ value, size, theme, highlighted, fallDistance }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);
  const glowLoop = useRef(null);

  // Drop animation on empty -> filled.
  useEffect(() => {
    if (prevValue.current === EMPTY && value !== EMPTY) {
      translateY.setValue(-(fallDistance || size * 6));
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 9,
        speed: 11,
      }).start();
    }
    prevValue.current = value;
  }, [value, fallDistance, size, translateY]);

  // Winning pulse.
  useEffect(() => {
    if (highlighted) {
      glowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      glowLoop.current.start();
    } else {
      if (glowLoop.current) glowLoop.current.stop();
      glow.setValue(0);
    }
    return () => {
      if (glowLoop.current) glowLoop.current.stop();
    };
  }, [highlighted, glow]);

  const isEmpty = value === EMPTY;
  const fill = isEmpty ? theme.emptyCell : playerColors(theme, value).color;
  const glowColor = isEmpty ? 'transparent' : playerColors(theme, value).glow;

  const pulseScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const pulseOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const dim = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Animated.View
      style={[
        styles.wrap,
        dim,
        { transform: [{ translateY }] },
      ]}
    >
      {/* Pulsing glow ring behind the disc (winning cells only) */}
      {highlighted && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              backgroundColor: glowColor,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.disc,
          dim,
          { backgroundColor: fill },
          highlighted && { borderWidth: 3, borderColor: '#ffffff' },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    // filled via props
  },
  glowRing: {
    position: 'absolute',
  },
});

export default Disc;
