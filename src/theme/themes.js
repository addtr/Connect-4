// Visual themes. Each theme defines the two player disc colors plus board/UI
// colors. Kept as plain data so the settings screen can offer alternates and
// pass-two polish can add more without touching component code.

export const THEMES = {
  classic: {
    key: 'classic',
    label: 'Classic',
    background: '#12203a',
    boardColor: '#1e5bd6',
    boardShadow: '#164bb0',
    emptyCell: '#12203a',
    playerOne: {
      color: '#e23b3b',
      glow: '#ff6b6b',
      label: 'Red',
    },
    playerTwo: {
      color: '#f2c40d',
      glow: '#ffe066',
      label: 'Yellow',
    },
    text: '#f5f7fb',
    textMuted: '#9fb0cc',
    accent: '#4da3ff',
  },
  midnight: {
    key: 'midnight',
    label: 'Midnight',
    background: '#0d0f1a',
    boardColor: '#2a2d45',
    boardShadow: '#1c1e30',
    emptyCell: '#0d0f1a',
    playerOne: {
      color: '#ff5c8a',
      glow: '#ff8fb0',
      label: 'Pink',
    },
    playerTwo: {
      color: '#37d0c4',
      glow: '#6ff0e6',
      label: 'Teal',
    },
    text: '#f2f3f7',
    textMuted: '#8b8fa8',
    accent: '#9d7bff',
  },
};

export const DEFAULT_THEME_KEY = 'classic';

export function getTheme(key) {
  return THEMES[key] || THEMES[DEFAULT_THEME_KEY];
}

// Convenience: color for a given player id (1 or 2) under a theme.
export function playerColors(theme, playerId) {
  return playerId === 1 ? theme.playerOne : theme.playerTwo;
}
