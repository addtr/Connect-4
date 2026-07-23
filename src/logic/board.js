// Board representation and the fundamental "gravity" mechanics of Connect Four.
//
// The board is a 2D array indexed as board[row][col].
//   - row 0 is the TOP of the grid, row ROWS-1 is the BOTTOM.
//   - a dropped piece falls to the lowest empty row in its column.
// Every function here is pure: it never mutates the board passed in.

import { ROWS, COLS, EMPTY } from './constants';

// Create a fresh, empty board.
export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

// Deep-copy a board so callers (and the minimax search) can explore moves
// without mutating shared state.
export function cloneBoard(board) {
  return board.map((row) => row.slice());
}

// A column is playable if its top cell is still empty.
export function isColumnPlayable(board, col) {
  return col >= 0 && col < COLS && board[0][col] === EMPTY;
}

// List all columns that currently accept a piece.
export function getValidColumns(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) cols.push(c);
  }
  return cols;
}

// Given a column, return the row index a newly dropped piece would occupy,
// or -1 if the column is full.
export function getDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}

// Drop a piece for `player` into `col`. Returns a NEW board plus the landing
// coordinates: { board, row, col }. Returns null if the move is illegal.
export function dropPiece(board, col, player) {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  const next = cloneBoard(board);
  next[row][col] = player;
  return { board: next, row, col };
}

// True when every top cell is filled (no legal moves remain).
export function isBoardFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}
