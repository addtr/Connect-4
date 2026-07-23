// Connect Four bot: depth-limited minimax with alpha-beta pruning.
//
// This is intentionally NOT a perfect solver. Connect Four is solved (first
// player wins with perfect play), but for a casual app we want a bot that feels
// smart and challenging on Hard while remaining beatable. Difficulty is tuned
// via search depth plus a chance of playing a random legal move.
//
// The heuristic evaluates every 4-cell "window" on the board and rewards the AI
// for building toward connect-fours while penalizing letting the opponent do so.

import { ROWS, COLS, EMPTY, CONNECT, opponentOf } from './constants';
import {
  getValidColumns,
  dropPiece,
  isBoardFull,
} from './board';
import { checkWinFromMove } from './winDetection';

// Difficulty presets. `randomChance` is the probability of ignoring the search
// result and playing a random legal move instead — the main lever that keeps
// easier bots beatable and slightly unpredictable.
export const DIFFICULTY = {
  EASY: { key: 'EASY', label: 'Easy', depth: 2, randomChance: 0.45 },
  MEDIUM: { key: 'MEDIUM', label: 'Medium', depth: 4, randomChance: 0.12 },
  HARD: { key: 'HARD', label: 'Hard', depth: 6, randomChance: 0 },
};

const WIN_SCORE = 1_000_000;

// Score a single 4-cell window from the AI's perspective.
function evaluateWindow(window, aiPlayer) {
  const opp = opponentOf(aiPlayer);
  let ai = 0;
  let other = 0;
  let empty = 0;
  for (const cell of window) {
    if (cell === aiPlayer) ai++;
    else if (cell === opp) other++;
    else empty++;
  }

  // A window with both players in it can never become a connect-four, so it is
  // neutral.
  if (ai > 0 && other > 0) return 0;

  let score = 0;
  if (ai === 4) score += 100;
  else if (ai === 3 && empty === 1) score += 8;
  else if (ai === 2 && empty === 2) score += 3;

  if (other === 3 && empty === 1) score -= 10; // block opponent threats hard
  else if (other === 2 && empty === 2) score -= 3;

  return score;
}

// Static evaluation of a non-terminal board from the AI's perspective.
function scorePosition(board, aiPlayer) {
  let score = 0;

  // Prefer central columns: they participate in more potential lines.
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === aiPlayer) centerCount++;
  }
  score += centerCount * 6;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - CONNECT; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, aiPlayer);
    }
  }
  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - CONNECT; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, aiPlayer);
    }
  }
  // Diagonal \ windows
  for (let r = 0; r <= ROWS - CONNECT; r++) {
    for (let c = 0; c <= COLS - CONNECT; c++) {
      const window = [
        board[r][c],
        board[r + 1][c + 1],
        board[r + 2][c + 2],
        board[r + 3][c + 3],
      ];
      score += evaluateWindow(window, aiPlayer);
    }
  }
  // Diagonal / windows
  for (let r = CONNECT - 1; r < ROWS; r++) {
    for (let c = 0; c <= COLS - CONNECT; c++) {
      const window = [
        board[r][c],
        board[r - 1][c + 1],
        board[r - 2][c + 2],
        board[r - 3][c + 3],
      ];
      score += evaluateWindow(window, aiPlayer);
    }
  }

  return score;
}

// Order candidate columns center-first. Better move ordering means alpha-beta
// prunes more aggressively, keeping Hard responsive.
function orderedColumns(board) {
  const cols = getValidColumns(board);
  const center = (COLS - 1) / 2;
  return cols.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

// Core recursive search. Returns { col, score }.
// `depthFromRoot` is used only to prefer faster wins / slower losses.
function minimax(board, depth, alpha, beta, maximizing, aiPlayer, lastMove, depthFromRoot) {
  // Terminal check based on the move that produced this board.
  if (lastMove) {
    const win = checkWinFromMove(board, lastMove.row, lastMove.col);
    if (win) {
      // If the AI just moved and won -> good; if the human just moved -> bad.
      // `maximizing` is whose turn it is NOW, so the mover was the opposite.
      const aiJustWon = win.player === aiPlayer;
      const magnitude = WIN_SCORE - depthFromRoot; // prefer sooner wins
      return { col: lastMove.col, score: aiJustWon ? magnitude : -magnitude };
    }
  }

  if (isBoardFull(board)) return { col: null, score: 0 };
  if (depth === 0) return { col: null, score: scorePosition(board, aiPlayer) };

  const columns = orderedColumns(board);
  const player = maximizing ? aiPlayer : opponentOf(aiPlayer);
  let bestCol = columns[0];

  if (maximizing) {
    let value = -Infinity;
    for (const col of columns) {
      const result = dropPiece(board, col, player);
      const next = minimax(
        result.board,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        { row: result.row, col: result.col },
        depthFromRoot + 1,
      );
      if (next.score > value) {
        value = next.score;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // beta cutoff
    }
    return { col: bestCol, score: value };
  } else {
    let value = Infinity;
    for (const col of columns) {
      const result = dropPiece(board, col, player);
      const next = minimax(
        result.board,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer,
        { row: result.row, col: result.col },
        depthFromRoot + 1,
      );
      if (next.score < value) {
        value = next.score;
        bestCol = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // alpha cutoff
    }
    return { col: bestCol, score: value };
  }
}

// Return a random element of an array.
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Public entry point. Returns the column the bot chooses to play.
//
// `difficulty` is one of the DIFFICULTY presets. The random-move chance adds
// variety and keeps easier bots beatable, but it never throws away a critical
// move on Medium/Hard: those difficulties always take an immediate win and
// always block an immediate loss, and only randomize among non-critical
// positions. Easy is looser — its random roll can even miss an obvious move,
// and it never blocks — which is what makes it a genuinely easy opponent.
export function chooseBotMove(board, aiPlayer, difficulty) {
  const valid = getValidColumns(board);
  if (valid.length === 0) return null;

  if (difficulty.key === 'EASY') {
    // Easy: frequently plays randomly (and may miss a win); never blocks.
    if (Math.random() < difficulty.randomChance) {
      return randomChoice(valid);
    }
    const win = findImmediateWin(board, aiPlayer);
    if (win !== null) return win;
    return runSearch(board, aiPlayer, difficulty, valid);
  }

  // Medium / Hard: critical moves are non-negotiable.
  const win = findImmediateWin(board, aiPlayer);
  if (win !== null) return win;

  const block = findImmediateWin(board, opponentOf(aiPlayer));
  if (block !== null) return block;

  // In non-critical positions, Medium occasionally plays a random legal move
  // ("mostly optimal but not perfect"); Hard never does.
  if (difficulty.randomChance > 0 && Math.random() < difficulty.randomChance) {
    return randomChoice(valid);
  }

  return runSearch(board, aiPlayer, difficulty, valid);
}

function runSearch(board, aiPlayer, difficulty, valid) {
  const { col } = minimax(
    board,
    difficulty.depth,
    -Infinity,
    Infinity,
    true,
    aiPlayer,
    null,
    0,
  );
  return col !== null && col !== undefined ? col : randomChoice(valid);
}

// If `player` can win by playing a single column right now, return that column.
export function findImmediateWin(board, player) {
  for (const col of getValidColumns(board)) {
    const result = dropPiece(board, col, player);
    if (result && checkWinFromMove(result.board, result.row, result.col)) {
      return col;
    }
  }
  return null;
}
