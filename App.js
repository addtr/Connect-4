// Root component. Pass one uses a lightweight screen switcher (no navigation
// dependency yet) to keep the scaffold lean and fully playable. The three
// screens — menu, game, settings — are swapped by local state.

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from './src/state/SettingsContext';
import { initFeedback } from './src/services/feedback';
import MainMenuScreen from './src/screens/MainMenuScreen';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const SCREEN = {
  MENU: 'MENU',
  GAME: 'GAME',
  SETTINGS: 'SETTINGS',
};

function AppRoot() {
  const [screen, setScreen] = useState(SCREEN.MENU);
  const [gameConfig, setGameConfig] = useState(null);

  // Preload sound effects once at startup (best-effort).
  useEffect(() => {
    initFeedback();
  }, []);

  const startGame = (config) => {
    setGameConfig(config);
    setScreen(SCREEN.GAME);
  };

  return (
    <>
      <StatusBar style="light" />
      {screen === SCREEN.MENU && (
        <MainMenuScreen
          onStartGame={startGame}
          onOpenSettings={() => setScreen(SCREEN.SETTINGS)}
        />
      )}
      {screen === SCREEN.GAME && gameConfig && (
        <GameScreen config={gameConfig} onExit={() => setScreen(SCREEN.MENU)} />
      )}
      {screen === SCREEN.SETTINGS && (
        <SettingsScreen onBack={() => setScreen(SCREEN.MENU)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoot />
    </SettingsProvider>
  );
}
