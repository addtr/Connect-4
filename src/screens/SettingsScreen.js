// Settings: theme, first-move preference (vs bot), best-of-N series length,
// sound / haptics toggles, and the Remove Ads purchase. Persisted via the
// settings + purchase contexts.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import { useSettings } from '../state/SettingsContext';
import { usePurchases } from '../services/purchases';
import { REMOVE_ADS_PRICE } from '../services/purchases';
import { THEMES } from '../theme/themes';
import { SERIES_OPTIONS, START_PREFERENCE } from '../logic/series';

const START_OPTIONS = [
  { key: START_PREFERENCE.YOU, label: 'You' },
  { key: START_PREFERENCE.BOT, label: 'Bot' },
  { key: START_PREFERENCE.RANDOM, label: 'Random' },
];

function SettingsScreen({ onBack }) {
  const {
    theme,
    themeKey,
    setThemeKey,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    startPreference,
    setStartPreference,
    seriesLength,
    setSeriesLength,
  } = useSettings();

  const { isAdFree, purchasing, purchaseRemoveAds, restorePurchases } = usePurchases();

  const onBuy = async () => {
    const res = await purchaseRemoveAds();
    if (res.success) {
      Alert.alert('Thank you!', 'Ads have been removed. Enjoy the game!');
    } else {
      Alert.alert('Purchase failed', res.error || 'Please try again later.');
    }
  };

  const onRestore = async () => {
    const res = await restorePurchases();
    Alert.alert(
      res.restored ? 'Purchases restored' : 'Nothing to restore',
      res.restored
        ? 'Your Remove Ads purchase is active.'
        : 'No previous purchase was found for this account.',
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.background, theme.boardShadow]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

          {/* Theme */}
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

          {/* First move vs bot */}
          <Text style={[styles.section, { color: theme.textMuted }]}>First move (vs Bot)</Text>
          <View style={styles.segment}>
            {START_OPTIONS.map((opt) => {
              const selected = opt.key === startPreference;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setStartPreference(opt.key)}
                  style={[
                    styles.segmentItem,
                    {
                      backgroundColor: selected ? theme.accent : 'transparent',
                      borderColor: selected ? theme.accent : theme.textMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: selected ? theme.text : theme.textMuted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Series length */}
          <Text style={[styles.section, { color: theme.textMuted }]}>Series length</Text>
          <View style={styles.pillWrap}>
            {SERIES_OPTIONS.map((n) => {
              const selected = n === seriesLength;
              return (
                <Pressable
                  key={n}
                  onPress={() => setSeriesLength(n)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? theme.accent : 'transparent',
                      borderColor: selected ? theme.accent : theme.textMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: selected ? theme.text : theme.textMuted },
                    ]}
                  >
                    Best of {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Feedback */}
          <Text style={[styles.section, { color: theme.textMuted }]}>Feedback</Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Sound effects</Text>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Haptics</Text>
            <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
          </View>

          {/* Remove ads */}
          <Text style={[styles.section, { color: theme.textMuted }]}>Ads</Text>
          {isAdFree ? (
            <View style={[styles.adFreeCard, { borderColor: theme.accent }]}>
              <Text style={[styles.adFreeText, { color: theme.text }]}>✓ Ads removed</Text>
              <Text style={[styles.adFreeSub, { color: theme.textMuted }]}>
                Thanks for supporting the game!
              </Text>
            </View>
          ) : (
            <>
              <Button
                title={purchasing ? 'Processing…' : `Remove Ads — ${REMOVE_ADS_PRICE}`}
                theme={theme}
                onPress={onBuy}
                style={purchasing ? { opacity: 0.7 } : null}
              />
              {purchasing && (
                <ActivityIndicator color={theme.textMuted} style={{ marginTop: 4 }} />
              )}
              <Pressable onPress={onRestore} disabled={purchasing} style={styles.restore}>
                <Text style={[styles.restoreText, { color: theme.textMuted }]}>
                  Restore purchases
                </Text>
              </Pressable>
            </>
          )}

          <View style={styles.footer}>
            <Button title="Back" theme={theme} onPress={onBack} />
          </View>
        </ScrollView>
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
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginTop: 40,
    marginBottom: 8,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
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
  segment: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentItem: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  adFreeCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  adFreeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  adFreeSub: {
    fontSize: 13,
    marginTop: 4,
  },
  restore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default SettingsScreen;
