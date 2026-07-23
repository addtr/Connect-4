// A thin, UI-agnostic game engine that composes the board / win logic into a
// single immutable game state. The UI dispatches column taps here and renders
// whatever comes back; it never has to know the rules.

import { PLAYER_ONE, PLAYER_TWO, opponentOf } from './constants';
import { createBoard, dropPiece, getValidColumns } from './board';
import { checkWinFromMove, isDraw } from './winDetection';

export const STATUS = {
  PLAYING: 'PLAYING',
  WIN: 'WIN',
  DRAW: 'DRAW',
};

export const MODE = {
  VS_BOT: 'VS_BOT',
  VS_PLAYER: 'VS_PLAYER',
};

// Build the starting game state. `startingPlayer` chooses who moves first
// (defaults to Player One).
export function createGame(startingPlayer = PLAYER_ONE) {
  return {
    board: createBoard(),
    startingPlayer,
    currentPlayer: startingPlayer,
    status: STATUS.PLAYING,
    winner: null, // player id when status === WIN
    winningCells: null, // [[r,c]...] for highlight
    lastMove: null, // { row, col } of most recent drop
    moveHistory: [], // list of { row, col, player } for undo
  };
}

// Apply a move in `col` for the current player. Returns a NEW game state, or the
// same state (unchanged) if the move is illegal or the game is over.
export function applyMove(game, col) {
  if (game.status !== STATUS.PLAYING) return game;

  const result = dropPiece(game.board, col, game.currentPlayer);
  if (!result) return game; // column full / invalid

  const { board, row } = result;
  const move = { row, col, player: game.currentPlayer };
  const moveHistory = [...game.moveHistory, move];

  const win = checkWinFromMove(board, row, col);
  if (win) {
    return {
      ...game,
      board,
      status: STATUS.WIN,
      winner: win.player,
      winningCells: win.cells,
      lastMove: { row, col },
      moveHistory,
    };
  }

  if (isDraw(board)) {
    return {
      ...game,
      board,
      status: STATUS.DRAW,
      winner: null,
      winningCells: null,
      lastMove: { row, col },
      moveHistory,
    };
  }

  return {
    ...game,
    board,
    currentPlayer: opponentOf(game.currentPlayer),
    lastMove: { row, col },
    moveHistory,
  };
}

// Undo the most recent move, returning to the prior state. Returns the same
// state if there is nothing to undo. Recomputed from history so it always lands
// in a consistent PLAYING state (even after a win).
export function undoMove(game) {
  if (game.moveHistory.length === 0) return game;

  const history = game.moveHistory.slice(0, -1);
  let state = createGame(game.startingPlayer);
  for (const move of history) {
    state = applyMove(state, move.col);
  }
  return state;
}

export function getValidMoves(game) {
  return getValidColumns(game.board);
}

export { PLAYER_ONE, PLAYER_TWO };
