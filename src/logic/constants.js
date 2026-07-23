// Core dimensions and cell values for the Connect Four board.
// These are pure constants with no UI dependency so game logic stays portable
// and easy to unit test.

export const ROWS = 6;
export const COLS = 7;

// Cell / player values. EMPTY is intentionally 0 so that array-fill defaults
// and truthiness checks behave predictably.
export const EMPTY = 0;
export const PLAYER_ONE = 1;
export const PLAYER_TWO = 2;

// Number of pieces in a row needed to win.
export const CONNECT = 4;

// The four directions we scan for a win: horizontal, vertical, and the two
// diagonals. Each entry is [rowDelta, colDelta].
export const WIN_DIRECTIONS = [
  [0, 1], // horizontal ->
  [1, 0], // vertical  |
  [1, 1], // diagonal  \
  [1, -1], // diagonal /
];

// Returns the opposing player id.
export function opponentOf(player) {
  return player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
}
