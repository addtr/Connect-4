// The gameplay screen. Handles both modes, the turn indicator, bot turns with a
// short "thinking" delay, sound/haptic feedback, a best-of-N series with a score
// counter, the configurable first-move preference, and ads (interstitials on
// undo / menu / game-end, plus a bottom banner). Rules live in gameEngine /
// minimax / series — this screen drives them and renders state.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Board from '../components/Board';
import Button from '../components/Button';
import BannerAd from '../components/BannerAd';
import { useSettings } from '../state/SettingsContext';
import { useAds } from '../services/ads';
import {
  createGame,
  applyMove,
  undoMove,
  STATUS,
  MODE,
} from '../logic/gameEngine';
import { PLAYER_ONE, PLAYER_TWO } from '../logic/constants';
import { chooseBotMove } from '../logic/minimax';
import {
  createMatch,
  recordGameResult,
  isSeriesOver,
  resolveVsBotStarter,
  passAndPlayStarter,
} from '../logic/series';
import { playerColors } from '../theme/themes';
import {
  playDrop,
  playWin,
  playDraw,
  hapticDrop,
  hapticWin,
  hapticDraw,
} from '../services/feedback';

// The bot always plays as Player Two; the human is Player One in vs-bot mode.
const BOT_PLAYER = PLAYER_TWO;

// Minimum time the bot appears to "think", so instant moves don't feel abrupt.
const BOT_THINK_MS = 500;

function GameScreen({ config, onExit }) {
  const { theme, soundEnabled, hapticsEnabled, startPreference, seriesLength } =
    useSettings();
  const { showInterstitial } = useAds();

  const isVsBot = config.mode === MODE.VS_BOT;

  // Who starts game number `gamesPlayed` in the current series.
  const starterFor = useCallback(
    (gamesPlayed) =>
      isVsBot ? resolveVsBotStarter(startPreference) : passAndPlayStarter(gamesPlayed),
    [isVsBot, startPreference],
  );

  const [match, setMatch] = useState(() => createMatch(seriesLength));
  const [game, setGame] = useState(() => createGame(starterFor(0)));
  const [botThinking, setBotThinking] = useState(false);
  const timerRef = useRef(null);

  const prevMoves = useRef(0);
  const prevStatus = useRef(STATUS.PLAYING);

  const isBotTurn = isVsBot && game.currentPlayer === BOT_PLAYER;

  const handleColumnPress = useCallback(
    (col) => {
      if (game.status !== STATUS.PLAYING) return;
      if (isBotTurn) return;
      setGame((g) => applyMove(g, col));
    },
    [game.status, isBotTurn],
  );

  // Drive the bot's turn.
  useEffect(() => {
    if (!isVsBot) return;
    if (game.status !== STATUS.PLAYING) return;
    if (game.currentPlayer !== BOT_PLAYER) return;

    setBotThinking(true);
    const startedAt = Date.now();
    const col = chooseBotMove(game.board, BOT_PLAYER, config.difficulty);
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, BOT_THINK_MS - elapsed);

    timerRef.current = setTimeout(() => {
      setBotThinking(false);
      if (col !== null && col !== undefined) {
        setGame((g) => applyMove(g, col));
      }
    }, wait);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, isVsBot]);

  // Feedback + series scoring, driven off state transitions.
  useEffect(() => {
    const moves = game.moveHistory.length;
    if (moves > prevMoves.current) {
      playDrop(soundEnabled);
      hapticDrop(hapticsEnabled);
    }
    prevMoves.current = moves;

    if (game.status !== prevStatus.current) {
      if (game.status === STATUS.WIN || game.status === STATUS.DRAW) {
        // Record the game into the series exactly once.
        setMatch((m) => recordGameResult(m, game.winner));
        // Celebrate, then show a post-game interstitial.
        if (game.status === STATUS.WIN) {
          setTimeout(() => {
            playWin(soundEnabled);
            hapticWin(hapticsEnabled);
          }, 280);
        } else {
          setTimeout(() => {
            playDraw(soundEnabled);
            hapticDraw(hapticsEnabled);
          }, 280);
        }
        setTimeout(() => showInterstitial(), 700);
      }
      prevStatus.current = game.status;
    }
  }, [game, soundEnabled, hapticsEnabled, showInterstitial]);

  const resetPerGameRefs = (g) => {
    prevMoves.current = g.moveHistory.length;
    prevStatus.current = g.status;
  };

  // Start the next game in the current series.
  const nextGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBotThinking(false);
    const g = createGame(starterFor(match.gamesPlayed));
    resetPerGameRefs(g);
    setGame(g);
  };

  // Start a brand new series (fresh scores).
  const newSeries = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBotThinking(false);
    setMatch(createMatch(seriesLength));
    const g = createGame(starterFor(0));
    resetPerGameRefs(g);
    setGame(g);
  };

  // Undo — gated behind an interstitial, per the app's ad design.
  const handleUndo = async () => {
    if (botThinking) return;
    if (game.moveHistory.length === 0) return;
    await showInterstitial();
    setGame((g) => {
      let next = undoMove(g);
      if (isVsBot && next.currentPlayer === BOT_PLAYER && next.moveHistory.length > 0) {
        next = undoMove(next);
      }
      resetPerGameRefs(next);
      return next;
    });
  };

  // Menu — also gated behind an interstitial.
  const handleMenu = async () => {
    await showInterstitial();
    onExit();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const turnLabel = getTurnLabel(game, config, botThinking);
  const activeColor =
    game.status === STATUS.PLAYING
      ? playerColors(theme, game.currentPlayer).color
      : theme.textMuted;

  const seriesDone = isSeriesOver(match);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.background, theme.boardShadow]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Button
            title="Menu"
            theme={theme}
            variant="ghost"
            onPress={handleMenu}
            style={styles.smallBtn}
          />
          <TurnIndicator
            label={turnLabel}
            color={activeColor}
            theme={theme}
            active={game.status === STATUS.PLAYING}
          />
          <Button
            title="Undo"
            theme={theme}
            variant="ghost"
            onPress={handleUndo}
            style={styles.smallBtn}
          />
        </View>

        <View style={styles.boardArea}>
          <Board
            board={game.board}
            theme={theme}
            onColumnPress={handleColumnPress}
            disabled={game.status !== STATUS.PLAYING || isBotTurn}
            winningCells={game.winningCells}
            previewPlayer={game.currentPlayer}
          />
          <ScoreBoard match={match} config={config} theme={theme} />
        </View>

        {game.status !== STATUS.PLAYING ? (
          <ResultOverlay
            game={game}
            match={match}
            config={config}
            theme={theme}
            seriesDone={seriesDone}
            onNextGame={nextGame}
            onNewSeries={newSeries}
            onExit={handleMenu}
          />
        ) : (
          <View style={styles.bottomSpacer} />
        )}
      </SafeAreaView>

      <BannerAd />
    </View>
  );
}

// Score counter shown beneath the board.
function ScoreBoard({ match, config, theme }) {
  const nameOne = playerName(PLAYER_ONE, config);
  const nameTwo = playerName(PLAYER_TWO, config);
  return (
    <View style={styles.scoreBoard}>
      <View style={styles.scoreSide}>
        <View style={[styles.scoreDot, { backgroundColor: theme.playerOne.color }]} />
        <Text style={[styles.scoreName, { color: theme.text }]}>{nameOne}</Text>
        <Text style={[styles.scoreValue, { color: theme.text }]}>{match.scoreP1}</Text>
      </View>
      <View style={styles.scoreMiddle}>
        <Text style={[styles.scoreSeries, { color: theme.textMuted }]}>
          Best of {match.seriesLength}
        </Text>
        <Text style={[styles.scoreTarget, { color: theme.textMuted }]}>
          First to {match.target}
        </Text>
      </View>
      <View style={styles.scoreSide}>
        <Text style={[styles.scoreValue, { color: theme.text }]}>{match.scoreP2}</Text>
        <Text style={[styles.scoreName, { color: theme.text }]}>{nameTwo}</Text>
        <View style={[styles.scoreDot, { backgroundColor: theme.playerTwo.color }]} />
      </View>
    </View>
  );
}

// Turn pill with a gentle breathing pulse while the game is live.
function TurnIndicator({ label, color, theme, active }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, label]);

  return (
    <View style={[styles.turnPill, { borderColor: color }]}>
      <Animated.View style={[styles.turnDot, { backgroundColor: color, opacity: pulse }]} />
      <Text style={[styles.turnText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

function getTurnLabel(game, config, botThinking) {
  if (game.status === STATUS.WIN) return `${playerName(game.winner, config)} wins!`;
  if (game.status === STATUS.DRAW) return "It's a draw";
  if (config.mode === MODE.VS_BOT && game.currentPlayer === BOT_PLAYER) {
    return botThinking ? 'Bot is thinking…' : 'Bot';
  }
  return `${playerName(game.currentPlayer, config)}'s turn`;
}

function playerName(playerId, config) {
  if (config.mode === MODE.VS_BOT) return playerId === PLAYER_ONE ? 'You' : 'Bot';
  return playerId === PLAYER_ONE ? 'Player 1' : 'Player 2';
}

function ResultOverlay({
  game,
  match,
  config,
  theme,
  seriesDone,
  onNextGame,
  onNewSeries,
  onExit,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 12 }).start();
  }, [anim]);

  let message;
  let accent = theme.text;
  if (seriesDone) {
    message = `${playerName(match.seriesWinner, config)} wins the series! 🏆`;
    accent = playerColors(theme, match.seriesWinner).color;
  } else if (game.status === STATUS.DRAW) {
    message = "It's a draw!";
  } else if (config.mode === MODE.VS_BOT) {
    message = game.winner === PLAYER_ONE ? 'You win! 🎉' : 'Bot wins';
    accent = playerColors(theme, game.winner).color;
  } else {
    message = `${playerName(game.winner, config)} wins! 🎉`;
    accent = playerColors(theme, game.winner).color;
  }

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: theme.boardColor,
          shadowColor: theme.boardShadow,
          opacity: anim,
          transform: [{ scale }],
        },
      ]}
    >
      {(game.status === STATUS.WIN || seriesDone) && (
        <View style={[styles.resultAccent, { backgroundColor: accent }]} />
      )}
      <Text style={[styles.overlayText, { color: theme.text }]}>{message}</Text>
      <Text style={[styles.overlayScore, { color: theme.textMuted }]}>
        {playerName(PLAYER_ONE, config)} {match.scoreP1} — {match.scoreP2}{' '}
        {playerName(PLAYER_TWO, config)}
      </Text>
      {seriesDone ? (
        <Button title="New Series" theme={theme} onPress={onNewSeries} />
      ) : (
        <Button title="Next Game" theme={theme} onPress={onNextGame} />
      )}
      <Button title="Main Menu" theme={theme} variant="ghost" onPress={onExit} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  smallBtn: {
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 0,
  },
  turnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  turnDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  turnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 22,
    gap: 18,
  },
  scoreSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  scoreName: {
    fontSize: 15,
    fontWeight: '700',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  scoreMiddle: {
    alignItems: 'center',
  },
  scoreSeries: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreTarget: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 110,
  },
  overlay: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  resultAccent: {
    width: 56,
    height: 6,
    borderRadius: 3,
    marginBottom: 14,
  },
  overlayText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  overlayScore: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
  },
});

export default GameScreen;
