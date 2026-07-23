// Main menu: choose a game mode (and bot difficulty) or open settings.
// Pass one keeps the layout clean and functional; pass two adds art / polish.

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '../components/Button';
import { useSettings } from '../state/SettingsContext';
import { DIFFICULTY } from '../logic/minimax';
import { MODE } from '../logic/gameEngine';

function MainMenuScreen({ onStartGame, onOpenSettings }) {
  const { theme } = useSettings();
  const [choosingDifficulty, setChoosingDifficulty] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Connect Four</Text>
        <View style={styles.discRow}>
          <View style={[styles.disc, { backgroundColor: theme.playerOne.color }]} />
          <View style={[styles.disc, { backgroundColor: theme.playerTwo.color }]} />
        </View>
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
                onPress={() =>
                  onStartGame({ mode: MODE.VS_BOT, difficulty: diff })
                }
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
  );
}

const styles = StyleSheet.create({
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
  },
  discRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  disc: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
