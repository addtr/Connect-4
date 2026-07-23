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

**Pass two (complete):** polish.

- Piece **drop animation** — the disc springs down from above the column and
  settles with a slight bounce.
- **Winning line** runs a looping glow/pulse on the four connecting pieces.
- Animated **column preview** — a pulsing ghost disc shows where a tapped
  piece will land.
- **Sound effects** (drop, win, draw, button tap) with a mute toggle, and
  **iOS haptics** (light impact on drop, success on win, warning on draw).
- Two color **themes** (Classic, Midnight), selectable in settings.
- Gradient backgrounds, animated menu hero, and an animated post-game overlay.

**Pass three (complete):** series play, options, and monetization backbone.

- **Best-of-N series** with a score counter under the board — selectable
  3/5/7/9/11/15/21 in settings (default best of 3); first to a majority wins
  the series. Draws count as a played game but award no point.
- **First-move preference** vs the bot — You / Bot / Random — in settings.
  Pass-and-play alternates the starter each game.
- **Ads backbone:** a bottom banner plus full-screen interstitials on Undo,
  Menu (mid-game), and after every game, with a short cooldown so two never
  stack back-to-back.
- **Remove Ads** one-time purchase ($1.99): a full entitlement layer (buy /
  restore, persisted) that hides all ads. The real StoreKit/AdMob calls only
  run in a native build, so they're isolated behind a documented seam with
  runnable placeholders (see below).
- Settings persist across restarts (AsyncStorage).

### Ads & purchase — native-build wiring

Ads and in-app purchases cannot run in Expo Go; they need a native build
(`eas build` / Xcode) and store configuration. The app ships the full
structure with the store/ads SDK calls stubbed so it stays runnable now:

- `src/services/ads.js` — interstitial flow + `<InterstitialPlaceholder>`.
  Replace the placeholder with a real AdMob `InterstitialAd`, and
  `src/components/BannerAd.js` with a real AdMob `BannerAd`
  (`react-native-google-mobile-ads`).
- `src/services/purchases.js` — entitlement state with a `runStorePurchase` /
  `runStoreRestore` seam. Set `SIMULATE_PURCHASES = false` and drop in
  StoreKit (`react-native-iap` / `expo-in-app-purchases` / RevenueCat) using
  `REMOVE_ADS_PRODUCT_ID`. Everything else in the app stays the same.

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
    series.js       #   best-of-N scoring + starter selection
    __tests__/      #   jest unit tests
  theme/themes.js   # color themes
  state/            # settings context (persisted: theme, sound, series, ...)
  services/
    feedback.js     # sound + haptic playback (gated on settings)
    ads.js          # interstitial flow + provider (AdMob seam)
    purchases.js    # Remove Ads entitlement (StoreKit seam)
  components/       # Board, Disc (animated), Button, BannerAd
  screens/          # MainMenu, Game, Settings
App.js              # root screen switcher + providers
assets/sounds/      # generated WAV sound effects
```

## Bot difficulty

The bot uses depth-limited minimax with alpha-beta pruning — intentionally not
a perfect solver, so it stays beatable and casual.

| Difficulty | Search depth | Random-move chance | Blocks obvious threats |
|-----------|--------------|--------------------|------------------------|
| Easy      | 2 ply        | 45%                | no (may slip)          |
| Medium    | 4 ply        | 12%                | yes                    |
| Hard      | 6 ply        | 0%                 | yes                    |

On Medium and Hard, immediate wins and immediate blocks are never skipped — the
random-move chance only adds variety in non-critical positions, so those bots
never blunder an obvious move. Easy is looser: it may play randomly even when a
win is available and never blocks, which keeps it a genuinely easy opponent. On
the bot's turn a short (~500 ms) "thinking" delay is applied so instant moves
don't feel abrupt.

## Running

```bash
npm install
npm start        # then press i (iOS), a (Android), or w (web)
```

## Testing

```bash
npm test
```
