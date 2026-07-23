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
