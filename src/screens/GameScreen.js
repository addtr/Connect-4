// The gameplay screen. Handles both modes (vs bot, pass-and-play), the turn
// indicator, bot turns with a short "thinking" delay, sound/haptic feedback, and
// an animated post-game result overlay. All rules live in gameEngine / minimax —
// this screen drives them and renders state.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Board from '../components/Board';
import Button from '../components/Button';
import { useSettings } from '../state/SettingsContext';
import {
  createGame,
  applyMove,
  undoMove,
  STATUS,
  MODE,
} from '../logic/gameEngine';
import { PLAYER_ONE, PLAYER_TWO } from '../logic/constants';
import { chooseBotMove } from '../logic/minimax';
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
  const { theme, soundEnabled, hapticsEnabled } = useSettings();
  const [game, setGame] = useState(() => createGame());
  const [botThinking, setBotThinking] = useState(false);
  const timerRef = useRef(null);

  const prevMoves = useRef(0);
  const prevStatus = useRef(STATUS.PLAYING);

  const isVsBot = config.mode === MODE.VS_BOT;
  const isBotTurn = isVsBot && game.currentPlayer === BOT_PLAYER;

  const handleColumnPress = useCallback(
    (col) => {
      if (game.status !== STATUS.PLAYING) return;
      if (isBotTurn) return; // ignore taps during the bot's turn
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

  // Sound + haptic feedback driven off state transitions.
  useEffect(() => {
    const moves = game.moveHistory.length;
    if (moves > prevMoves.current) {
      playDrop(soundEnabled);
      hapticDrop(hapticsEnabled);
    }
    prevMoves.current = moves;

    if (game.status !== prevStatus.current) {
      if (game.status === STATUS.WIN) {
        // Let the drop settle first, then celebrate.
        setTimeout(() => {
          playWin(soundEnabled);
          hapticWin(hapticsEnabled);
        }, 280);
      } else if (game.status === STATUS.DRAW) {
        setTimeout(() => {
          playDraw(soundEnabled);
          hapticDraw(hapticsEnabled);
        }, 280);
      }
      prevStatus.current = game.status;
    }
  }, [game, soundEnabled, hapticsEnabled]);

  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBotThinking(false);
    prevMoves.current = 0;
    prevStatus.current = STATUS.PLAYING;
    setGame(createGame());
  };

  const handleUndo = () => {
    if (botThinking) return;
    setGame((g) => {
      let next = undoMove(g);
      if (isVsBot && next.currentPlayer === BOT_PLAYER && next.moveHistory.length > 0) {
        next = undoMove(next);
      }
      // Keep feedback counters in sync so undo doesn't trigger a drop sound.
      prevMoves.current = next.moveHistory.length;
      prevStatus.current = next.status;
      return next;
    });
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
            onPress={onExit}
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
        </View>

        {game.status !== STATUS.PLAYING ? (
          <ResultOverlay
            game={game}
            config={config}
            theme={theme}
            onPlayAgain={resetGame}
            onExit={onExit}
          />
        ) : (
          <View style={styles.bottomSpacer} />
        )}
      </SafeAreaView>
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
      <Animated.View
        style={[styles.turnDot, { backgroundColor: color, opacity: pulse }]}
      />
      <Text style={[styles.turnText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

function getTurnLabel(game, config, botThinking) {
  if (game.status === STATUS.WIN) {
    return `${playerName(game.winner, config)} wins!`;
  }
  if (game.status === STATUS.DRAW) return "It's a draw";
  if (config.mode === MODE.VS_BOT && game.currentPlayer === PLAYER_TWO) {
    return botThinking ? 'Bot is thinking…' : 'Bot';
  }
  return `${playerName(game.currentPlayer, config)}'s turn`;
}

function playerName(playerId, config) {
  if (config.mode === MODE.VS_BOT) {
    return playerId === PLAYER_ONE ? 'You' : 'Bot';
  }
  return playerId === PLAYER_ONE ? 'Player 1' : 'Player 2';
}

function ResultOverlay({ game, config, theme, onPlayAgain, onExit }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();
  }, [anim]);

  let message;
  let accent = theme.text;
  if (game.status === STATUS.DRAW) {
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
      {game.status === STATUS.WIN && (
        <View style={[styles.resultAccent, { backgroundColor: accent }]} />
      )}
      <Text style={[styles.overlayText, { color: theme.text }]}>{message}</Text>
      <Button title="Play Again" theme={theme} onPress={onPlayAgain} />
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
  bottomSpacer: {
    height: 120,
  },
  overlay: {
    marginHorizontal: 20,
    marginBottom: 30,
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
    marginBottom: 12,
  },
});

export default GameScreen;
