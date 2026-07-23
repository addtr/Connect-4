# Connect Four

A polished, native-feeling Connect Four game for iOS (and Android/web via
Expo), built with React Native + Expo.

## Game modes

- **Player vs Bot** — selectable difficulty: Easy / Medium / Hard.
- **Player vs Player (Pass & Play)** — two people share one device, taking
  turns tapping columns, with a clear turn indicator.

## Status

**Pass one (complete):** full game logic and a minimal, fully playable UI.

- Standard 7×6 grid, gravity-based piece drops.
- Win detection (horizontal, vertical, both diagonals) and draw detection.
- Turn management, undo, reset / new game.
- Minimax bot with alpha-beta pruning at three difficulties.
- Two color themes and a settings screen (sound/haptics toggles are wired
  as state, ready for pass two).

**Pass two (planned):** drop animations with settle/bounce, winning-line glow,
richer column previews, sound effects, iOS haptics, and menu/post-game polish.

## Architecture

Game logic is deliberately isolated from the UI so it is easy to test and to
retune the bot later.

```
src/
  logic/            # pure, UI-agnostic game logic (unit tested)
    constants.js    #   dimensions, player ids, directions
    board.js        #   board creation, gravity, valid moves
    winDetection.js #   win / draw detection
    minimax.js      #   bot AI (alpha-beta) + difficulty presets
    gameEngine.js   #   immutable game-state composition (turns, status)
    __tests__/      #   jest unit tests
  theme/themes.js   # color themes
  state/            # settings context (theme, sound, haptics)
  components/       # Board, Disc, Button
  screens/          # MainMenu, Game, Settings
App.js              # root screen switcher
```

## Bot difficulty

The bot uses depth-limited minimax with alpha-beta pruning — intentionally not
a perfect solver, so it stays beatable and casual.

| Difficulty | Search depth | Random-move chance | Blocks obvious threats |
|-----------|--------------|--------------------|------------------------|
| Easy      | 2 ply        | 45%                | no (may slip)          |
| Medium    | 4 ply        | 12%                | yes                    |
| Hard      | 6 ply        | 0%                 | yes                    |

Immediate wins are always taken. On the bot's turn a short (~500 ms) "thinking"
delay is applied so instant moves don't feel abrupt.

## Running

```bash
npm install
npm start        # then press i (iOS), a (Android), or w (web)
```

## Testing

```bash
npm test
```
