// Main menu: choose a game mode (and bot difficulty) or open settings.
// Gradient background plus a gently bobbing pair of hero discs for a bit of life
// on the launch screen.

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import { useSettings } from '../state/SettingsContext';
import { DIFFICULTY } from '../logic/minimax';
import { MODE } from '../logic/gameEngine';

function MainMenuScreen({ onStartGame, onOpenSettings }) {
  const { theme } = useSettings();
  const [choosingDifficulty, setChoosingDifficulty] = useState(false);

  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateOne = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const translateTwo = bob.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.background, theme.boardShadow]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.discRow}>
            <Animated.View
              style={[
                styles.disc,
                {
                  backgroundColor: theme.playerOne.color,
                  transform: [{ translateY: translateOne }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.disc,
                {
                  backgroundColor: theme.playerTwo.color,
                  transform: [{ translateY: translateTwo }],
                },
              ]}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Connect Four</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Four in a row wins
          </Text>
        </View>

        <View style={styles.menu}>
          {!choosingDifficulty ? (
            <>
              <Button
                title="Play vs Bot"
                theme={theme}
                onPress={() => setChoosingDifficulty(true)}
              />
              <Button
                title="Play vs Friend"
                theme={theme}
                variant="secondary"
                onPress={() => onStartGame({ mode: MODE.VS_PLAYER })}
              />
              <Button
                title="Settings"
                theme={theme}
                variant="ghost"
                onPress={onOpenSettings}
              />
            </>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Choose difficulty
              </Text>
              {Object.values(DIFFICULTY).map((diff) => (
                <Button
                  key={diff.key}
                  title={diff.label}
                  theme={theme}
                  onPress={() => onStartGame({ mode: MODE.VS_BOT, difficulty: diff })}
                />
              ))}
              <Button
                title="Back"
                theme={theme}
                variant="ghost"
                onPress={() => setChoosingDifficulty(false)}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 72,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 24,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  discRow: {
    flexDirection: 'row',
  },
  disc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  menu: {
    alignItems: 'center',
    marginBottom: 80,
  },
});

export default MainMenuScreen;
