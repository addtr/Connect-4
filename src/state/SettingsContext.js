// App-wide settings: theme, sound + haptics toggles, who starts vs the bot, and
// the best-of-N series length. Persisted to AsyncStorage so choices survive
// app restarts.

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME_KEY, getTheme, THEMES } from '../theme/themes';
import {
  DEFAULT_SERIES_LENGTH,
  SERIES_OPTIONS,
  DEFAULT_START_PREFERENCE,
  START_PREFERENCE,
} from '../logic/series';

const STORAGE_KEY = '@connect4/settings';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [startPreference, setStartPreference] = useState(DEFAULT_START_PREFERENCE);
  const [seriesLength, setSeriesLength] = useState(DEFAULT_SERIES_LENGTH);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted settings once.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.themeKey && THEMES[s.themeKey]) setThemeKey(s.themeKey);
          if (typeof s.soundEnabled === 'boolean') setSoundEnabled(s.soundEnabled);
          if (typeof s.hapticsEnabled === 'boolean') setHapticsEnabled(s.hapticsEnabled);
          if (START_PREFERENCE[s.startPreference]) setStartPreference(s.startPreference);
          if (SERIES_OPTIONS.includes(s.seriesLength)) setSeriesLength(s.seriesLength);
        }
      } catch (e) {
        /* fall back to defaults */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on change (after initial hydration so we don't overwrite with
  // defaults before the stored values load).
  const first = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (first.current) {
      first.current = false;
      return;
    }
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ themeKey, soundEnabled, hapticsEnabled, startPreference, seriesLength }),
    ).catch(() => {});
  }, [hydrated, themeKey, soundEnabled, hapticsEnabled, startPreference, seriesLength]);

  const value = useMemo(
    () => ({
      themeKey,
      setThemeKey,
      theme: getTheme(themeKey),
      soundEnabled,
      setSoundEnabled,
      hapticsEnabled,
      setHapticsEnabled,
      startPreference,
      setStartPreference,
      seriesLength,
      setSeriesLength,
      hydrated,
    }),
    [themeKey, soundEnabled, hapticsEnabled, startPreference, seriesLength, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
