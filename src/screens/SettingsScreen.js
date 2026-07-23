// Settings: theme selection plus sound / haptics toggles. Pass one wires theme
// switching (visible immediately) and the toggle state; pass two connects the
// toggles to actual sound + haptic playback.

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import { useSettings } from '../state/SettingsContext';
import { THEMES } from '../theme/themes';

function SettingsScreen({ onBack }) {
  const {
    theme,
    themeKey,
    setThemeKey,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
  } = useSettings();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.background, theme.boardShadow]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      <Text style={[styles.section, { color: theme.textMuted }]}>Theme</Text>
      <View style={styles.themeRow}>
        {Object.values(THEMES).map((t) => {
          const selected = t.key === themeKey;
          return (
            <Pressable
              key={t.key}
              onPress={() => setThemeKey(t.key)}
              style={[
                styles.themeCard,
                {
                  backgroundColor: t.boardColor,
                  borderColor: selected ? theme.text : 'transparent',
                },
              ]}
            >
              <View style={styles.themeDiscs}>
                <View style={[styles.themeDisc, { backgroundColor: t.playerOne.color }]} />
                <View style={[styles.themeDisc, { backgroundColor: t.playerTwo.color }]} />
              </View>
              <Text style={[styles.themeLabel, { color: t.text }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: theme.textMuted }]}>Feedback</Text>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Sound effects</Text>
        <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Haptics</Text>
        <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
      </View>

        <View style={styles.footer}>
          <Button title="Back" theme={theme} onPress={onBack} />
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 60,
    marginBottom: 24,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
  },
  themeCard: {
    borderRadius: 16,
    borderWidth: 3,
    padding: 16,
    marginRight: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  themeDiscs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  themeDisc: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
});

export default SettingsScreen;
