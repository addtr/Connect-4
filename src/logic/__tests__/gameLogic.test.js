// Unit tests for the pure game logic: board mechanics, win/draw detection, the
// game engine, and bot behavior. These have no UI dependency and run under
// jest-expo (`npm test`).

import { ROWS, COLS, EMPTY, PLAYER_ONE, PLAYER_TWO } from '../constants';
import {
  createBoard,
  dropPiece,
  getDropRow,
  getValidColumns,
  isColumnPlayable,
  isBoardFull,
} from '../board';
import { checkWinner, checkWinFromMove, isDraw } from '../winDetection';
import { createGame, applyMove, undoMove, STATUS } from '../gameEngine';
import { chooseBotMove, findImmediateWin, DIFFICULTY } from '../minimax';
import {
  createMatch,
  recordGameResult,
  isSeriesOver,
  winsNeeded,
  resolveVsBotStarter,
  passAndPlayStarter,
  shouldShowPostGameAd,
  shouldShowSeriesCompletionAd,
  START_PREFERENCE,
} from '../series';

describe('board mechanics', () => {
  test('createBoard is empty and correctly sized', () => {
    const b = createBoard();
    expect(b.length).toBe(ROWS);
    expect(b[0].length).toBe(COLS);
    expect(b.flat().every((c) => c === EMPTY)).toBe(true);
  });

  test('pieces fall to the bottom and stack', () => {
    let d = dropPiece(createBoard(), 3, PLAYER_ONE);
    expect(d.row).toBe(ROWS - 1);
    d = dropPiece(d.board, 3, PLAYER_TWO);
    expect(d.row).toBe(ROWS - 2);
  });

  test('full column is unplayable and drop returns null', () => {
    let b = createBoard();
    for (let i = 0; i < ROWS; i++) b = dropPiece(b, 0, PLAYER_ONE).board;
    expect(isColumnPlayable(b, 0)).toBe(false);
    expect(getValidColumns(b)).not.toContain(0);
    expect(dropPiece(b, 0, PLAYER_ONE)).toBeNull();
    expect(getDropRow(b, 0)).toBe(-1);
  });
});

describe('win detection', () => {
  test('horizontal win', () => {
    const b = createBoard();
    for (let c = 0; c < 4; c++) b[ROWS - 1][c] = PLAYER_ONE;
    expect(checkWinner(b).player).toBe(PLAYER_ONE);
    expect(checkWinner(b).cells).toHaveLength(4);
  });

  test('vertical win', () => {
    const b = createBoard();
    for (let r = ROWS - 4; r < ROWS; r++) b[r][2] = PLAYER_TWO;
    expect(checkWinner(b).player).toBe(PLAYER_TWO);
  });

  test('diagonal (\\) win', () => {
    const b = createBoard();
    b[2][0] = PLAYER_ONE;
    b[3][1] = PLAYER_ONE;
    b[4][2] = PLAYER_ONE;
    b[5][3] = PLAYER_ONE;
    expect(checkWinner(b).player).toBe(PLAYER_ONE);
  });

  test('diagonal (/) win', () => {
    const b = createBoard();
    b[5][0] = PLAYER_TWO;
    b[4][1] = PLAYER_TWO;
    b[3][2] = PLAYER_TWO;
    b[2][3] = PLAYER_TWO;
    expect(checkWinner(b).player).toBe(PLAYER_TWO);
  });

  test('checkWinFromMove catches a win completed in the middle of a run', () => {
    const b = createBoard();
    b[5][0] = PLAYER_ONE;
    b[5][1] = PLAYER_ONE;
    b[5][3] = PLAYER_ONE;
    const d = dropPiece(b, 2, PLAYER_ONE); // fills the gap
    expect(checkWinFromMove(d.board, d.row, d.col).player).toBe(PLAYER_ONE);
  });

  test('draw: full board with no winner', () => {
    const b = createBoard();
    const pattern = [
      [1, 1, 1, 2, 2, 2, 1],
      [2, 2, 2, 1, 1, 1, 2],
      [1, 1, 1, 2, 2, 2, 1],
      [2, 2, 2, 1, 1, 1, 2],
      [1, 1, 1, 2, 2, 2, 1],
      [2, 2, 2, 1, 1, 1, 2],
    ];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) b[r][c] = pattern[r][c];
    expect(isBoardFull(b)).toBe(true);
    expect(checkWinner(b)).toBeNull();
    expect(isDraw(b)).toBe(true);
  });
});

describe('game engine', () => {
  test('players alternate on each move', () => {
    let g = createGame();
    expect(g.currentPlayer).toBe(PLAYER_ONE);
    g = applyMove(g, 0);
    expect(g.currentPlayer).toBe(PLAYER_TWO);
    g = applyMove(g, 1);
    expect(g.currentPlayer).toBe(PLAYER_ONE);
  });

  test('illegal move on full column leaves state unchanged', () => {
    let g = createGame();
    for (let i = 0; i < ROWS; i++) g = applyMove(g, 0);
    const before = g;
    const after = applyMove(g, 0);
    expect(after).toBe(before);
  });

  test('reaching a win sets WIN status and winning cells', () => {
    let g = createGame();
    // P1 stacks column 0 vertically; P2 plays column 1 in between.
    g = applyMove(g, 0); // P1
    g = applyMove(g, 1); // P2
    g = applyMove(g, 0); // P1
    g = applyMove(g, 1); // P2
    g = applyMove(g, 0); // P1
    g = applyMove(g, 1); // P2
    g = applyMove(g, 0); // P1 -> vertical four
    expect(g.status).toBe(STATUS.WIN);
    expect(g.winner).toBe(PLAYER_ONE);
    expect(g.winningCells).toHaveLength(4);
  });

  test('undo restores the previous state', () => {
    let g = createGame();
    g = applyMove(g, 3);
    const afterOne = g;
    g = applyMove(g, 3);
    g = undoMove(g);
    expect(g.currentPlayer).toBe(afterOne.currentPlayer);
    expect(g.moveHistory).toHaveLength(1);
  });

  test('a configurable starting player moves first and survives undo', () => {
    let g = createGame(PLAYER_TWO);
    expect(g.currentPlayer).toBe(PLAYER_TWO);
    g = applyMove(g, 0); // P2
    expect(g.currentPlayer).toBe(PLAYER_ONE);
    g = applyMove(g, 1); // P1
    g = undoMove(g);
    expect(g.currentPlayer).toBe(PLAYER_ONE);
    g = undoMove(g);
    expect(g.currentPlayer).toBe(PLAYER_TWO); // back to the original starter
  });
});

describe('best-of-N series', () => {
  test('winsNeeded is a majority of the series length', () => {
    expect(winsNeeded(3)).toBe(2);
    expect(winsNeeded(5)).toBe(3);
    expect(winsNeeded(21)).toBe(11);
  });

  test('scores accumulate and a draw awards no point', () => {
    let m = createMatch(5);
    expect(m.target).toBe(3);
    m = recordGameResult(m, PLAYER_ONE);
    m = recordGameResult(m, PLAYER_TWO);
    m = recordGameResult(m, null); // draw
    expect(m.scoreP1).toBe(1);
    expect(m.scoreP2).toBe(1);
    expect(m.gamesPlayed).toBe(3);
    expect(isSeriesOver(m)).toBe(false);
  });

  test('single game (best of 1) is decided by one win', () => {
    let m = createMatch(1);
    expect(m.target).toBe(1);
    m = recordGameResult(m, PLAYER_TWO);
    expect(isSeriesOver(m)).toBe(true);
    expect(m.seriesWinner).toBe(PLAYER_TWO);
  });

  test('series ends when a player reaches the target', () => {
    let m = createMatch(3); // first to 2
    m = recordGameResult(m, PLAYER_ONE);
    expect(isSeriesOver(m)).toBe(false);
    m = recordGameResult(m, PLAYER_ONE);
    expect(isSeriesOver(m)).toBe(true);
    expect(m.seriesWinner).toBe(PLAYER_ONE);
  });

  test('start-preference resolution', () => {
    expect(resolveVsBotStarter(START_PREFERENCE.YOU)).toBe(PLAYER_ONE);
    expect(resolveVsBotStarter(START_PREFERENCE.BOT)).toBe(PLAYER_TWO);
    const r = resolveVsBotStarter(START_PREFERENCE.RANDOM);
    expect([PLAYER_ONE, PLAYER_TWO]).toContain(r);
  });

  test('pass-and-play alternates the starter each game', () => {
    expect(passAndPlayStarter(0)).toBe(PLAYER_ONE);
    expect(passAndPlayStarter(1)).toBe(PLAYER_TWO);
    expect(passAndPlayStarter(2)).toBe(PLAYER_ONE);
  });

  test('post-game ad frequency by series length', () => {
    // Single game / best of 3: never.
    for (let g = 1; g <= 3; g++) {
      expect(shouldShowPostGameAd(1, g)).toBe(false);
      expect(shouldShowPostGameAd(3, g)).toBe(false);
    }
    // Best of 5: only after game 3.
    expect(shouldShowPostGameAd(5, 1)).toBe(false);
    expect(shouldShowPostGameAd(5, 3)).toBe(true);
    expect(shouldShowPostGameAd(5, 4)).toBe(false);
    // Best of 7+: every 3 games.
    expect(shouldShowPostGameAd(7, 3)).toBe(true);
    expect(shouldShowPostGameAd(7, 6)).toBe(true);
    expect(shouldShowPostGameAd(9, 5)).toBe(false);
    expect(shouldShowPostGameAd(21, 9)).toBe(true);
  });

  test('series-completion ad cadence for short series', () => {
    // Single game: every 4 completed series.
    expect(shouldShowSeriesCompletionAd(1, 1)).toBe(false);
    expect(shouldShowSeriesCompletionAd(1, 3)).toBe(false);
    expect(shouldShowSeriesCompletionAd(1, 4)).toBe(true);
    expect(shouldShowSeriesCompletionAd(1, 8)).toBe(true);
    // Best of 3: every 2 completed series.
    expect(shouldShowSeriesCompletionAd(3, 1)).toBe(false);
    expect(shouldShowSeriesCompletionAd(3, 2)).toBe(true);
    expect(shouldShowSeriesCompletionAd(3, 4)).toBe(true);
    // Longer series don't use this path.
    expect(shouldShowSeriesCompletionAd(5, 2)).toBe(false);
    expect(shouldShowSeriesCompletionAd(7, 4)).toBe(false);
  });
});

describe('bot AI', () => {
  test('takes an immediate winning move', () => {
    const b = createBoard();
    b[5][0] = PLAYER_TWO;
    b[5][1] = PLAYER_TWO;
    b[5][2] = PLAYER_TWO;
    expect(findImmediateWin(b, PLAYER_TWO)).toBe(3);
    expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD)).toBe(3);
  });

  test('blocks an immediate opponent win on medium and hard', () => {
    const b = createBoard();
    b[5][0] = PLAYER_ONE;
    b[5][1] = PLAYER_ONE;
    b[5][2] = PLAYER_ONE;
    expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD)).toBe(3);
    expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.MEDIUM)).toBe(3);
  });

  test('medium and hard reliably block across many runs (no random slip)', () => {
    const b = createBoard();
    b[5][0] = PLAYER_ONE;
    b[5][1] = PLAYER_ONE;
    b[5][2] = PLAYER_ONE;
    for (let i = 0; i < 50; i++) {
      expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.MEDIUM)).toBe(3);
      expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD)).toBe(3);
    }
  });

  test('hard reliably takes a win across many runs', () => {
    const b = createBoard();
    b[5][0] = PLAYER_TWO;
    b[5][1] = PLAYER_TWO;
    b[5][2] = PLAYER_TWO;
    for (let i = 0; i < 50; i++) {
      expect(chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD)).toBe(3);
    }
  });

  test('always returns a legal column', () => {
    const b = createBoard();
    const move = chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD);
    expect(getValidColumns(b)).toContain(move);
  });

  test('hard search stays fast on a mid-game board', () => {
    let b = createBoard();
    b = dropPiece(b, 3, PLAYER_ONE).board;
    b = dropPiece(b, 3, PLAYER_TWO).board;
    b = dropPiece(b, 2, PLAYER_ONE).board;
    b = dropPiece(b, 4, PLAYER_TWO).board;
    const start = Date.now();
    chooseBotMove(b, PLAYER_TWO, DIFFICULTY.HARD);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
