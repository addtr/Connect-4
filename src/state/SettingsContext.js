// App-wide settings (theme choice, sound + haptics toggles) exposed via React
// context. Pass one wires the state and the theme; sound/haptics flags are here
// now so pass two can consume them without a refactor.

import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_THEME_KEY, getTheme } from '../theme/themes';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const value = useMemo(
    () => ({
      themeKey,
      setThemeKey,
      theme: getTheme(themeKey),
      soundEnabled,
      setSoundEnabled,
      hapticsEnabled,
      setHapticsEnabled,
    }),
    [themeKey, soundEnabled, hapticsEnabled],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
