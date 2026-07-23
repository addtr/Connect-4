// The gameplay screen. Handles both modes (vs bot, pass-and-play), the turn
// indicator, bot turns with a short "thinking" delay, and the post-game result
// overlay. All rules live in gameEngine / minimax — this screen just drives them
// and renders state.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
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

// The bot always plays as Player Two; the human is Player One in vs-bot mode.
const BOT_PLAYER = PLAYER_TWO;

// Minimum time the bot appears to "think", so instant moves don't feel abrupt.
const BOT_THINK_MS = 500;

function GameScreen({ config, onExit }) {
  const { theme } = useSettings();
  const [game, setGame] = useState(() => createGame());
  const [botThinking, setBotThinking] = useState(false);
  const timerRef = useRef(null);

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
    // Compute the move (fast); then wait out the remaining think time.
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

  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBotThinking(false);
    setGame(createGame());
  };

  const handleUndo = () => {
    if (botThinking) return;
    // In vs-bot mode, undo both the bot's reply and the player's move so the
    // human gets their turn back.
    setGame((g) => {
      let next = undoMove(g);
      if (isVsBot && next.currentPlayer === BOT_PLAYER && next.moveHistory.length > 0) {
        next = undoMove(next);
      }
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Button title="Menu" theme={theme} variant="ghost" onPress={onExit} style={styles.smallBtn} />
        <View style={[styles.turnPill, { borderColor: activeColor }]}>
          <View style={[styles.turnDot, { backgroundColor: activeColor }]} />
          <Text style={[styles.turnText, { color: theme.text }]}>{turnLabel}</Text>
        </View>
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
  let message;
  if (game.status === STATUS.DRAW) {
    message = "It's a draw!";
  } else if (config.mode === MODE.VS_BOT) {
    message = game.winner === PLAYER_ONE ? 'You win! 🎉' : 'Bot wins';
  } else {
    message = `${playerName(game.winner, config)} wins! 🎉`;
  }

  return (
    <View style={[styles.overlay, { backgroundColor: theme.boardColor }]}>
      <Text style={[styles.overlayText, { color: theme.text }]}>{message}</Text>
      <Button title="Play Again" theme={theme} onPress={onPlayAgain} />
      <Button title="Main Menu" theme={theme} variant="ghost" onPress={onExit} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  overlayText: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
});

export default GameScreen;
