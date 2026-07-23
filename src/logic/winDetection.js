// Win and draw detection.
//
// Two entry points:
//   - checkWinner(board): scans the whole board (used for a from-scratch check).
//   - checkWinFromMove(board, row, col): only scans lines through the last move,
//     which is what gameplay and minimax should use for speed.
//
// A win result is { player, cells: [[r,c], [r,c], [r,c], [r,c]] } so the UI can
// highlight exactly the four connecting pieces. No win returns null.

import { ROWS, COLS, EMPTY, CONNECT, WIN_DIRECTIONS } from './constants';
import { isBoardFull } from './board';

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

// Scan the entire board for any winning line.
export function checkWinner(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const player = board[r][c];
      if (player === EMPTY) continue;
      const win = winningLineAt(board, r, c, player);
      if (win) return { player, cells: win };
    }
  }
  return null;
}

// From a given anchor cell, look forward along each direction for CONNECT in a
// row of the same player. Returns the cell list or null.
function winningLineAt(board, r, c, player) {
  for (const [dr, dc] of WIN_DIRECTIONS) {
    const cells = [[r, c]];
    for (let k = 1; k < CONNECT; k++) {
      const nr = r + dr * k;
      const nc = c + dc * k;
      if (inBounds(nr, nc) && board[nr][nc] === player) {
        cells.push([nr, nc]);
      } else {
        break;
      }
    }
    if (cells.length === CONNECT) return cells;
  }
  return null;
}

// Efficient check for gameplay/AI: only consider lines that pass through the
// piece just played at (row, col). Scans both directions from the move so it
// catches wins where the new piece is in the middle of the run.
export function checkWinFromMove(board, row, col) {
  const player = board[row][col];
  if (player === EMPTY) return null;

  for (const [dr, dc] of WIN_DIRECTIONS) {
    const cells = [[row, col]];

    // extend forward
    for (let k = 1; k < CONNECT; k++) {
      const nr = row + dr * k;
      const nc = col + dc * k;
      if (inBounds(nr, nc) && board[nr][nc] === player) cells.push([nr, nc]);
      else break;
    }
    // extend backward
    for (let k = 1; k < CONNECT; k++) {
      const nr = row - dr * k;
      const nc = col - dc * k;
      if (inBounds(nr, nc) && board[nr][nc] === player) cells.unshift([nr, nc]);
      else break;
    }

    if (cells.length >= CONNECT) {
      // Return exactly CONNECT cells forming the winning segment.
      return { player, cells: cells.slice(0, CONNECT) };
    }
  }
  return null;
}

// A draw is a full board with no winner.
export function isDraw(board) {
  return isBoardFull(board) && checkWinner(board) === null;
}
