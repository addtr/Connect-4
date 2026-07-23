// The Connect Four board. Renders 7 tappable columns of 6 cells and reports the
// tapped column up to the parent. Tapping a column shows a lightweight ghost
// preview of where the piece will land (pass two expands this into a richer
// preview + drop animation).

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ROWS, COLS, EMPTY } from '../logic/constants';
import { getDropRow, isColumnPlayable } from '../logic/board';
import { playerColors } from '../theme/themes';
import Disc from './Disc';

function Board({ board, theme, onColumnPress, disabled, winningCells, previewPlayer }) {
  const { width } = useWindowDimensions();
  const [activeCol, setActiveCol] = useState(null);

  // Size the board to fit the screen with side padding.
  const horizontalPadding = 32;
  const boardWidth = Math.min(width - horizontalPadding, 440);
  const cellSize = Math.floor(boardWidth / COLS) - 6;

  const isWinningCell = (r, c) =>
    !!winningCells && winningCells.some(([wr, wc]) => wr === r && wc === c);

  const handlePress = (col) => {
    if (disabled || !isColumnPlayable(board, col)) return;
    onColumnPress(col);
  };

  return (
    <View style={[styles.board, { backgroundColor: theme.boardColor, padding: 6 }]}>
      {Array.from({ length: COLS }).map((_, col) => {
        const previewRow =
          activeCol === col && !disabled && isColumnPlayable(board, col)
            ? getDropRow(board, col)
            : -1;

        return (
          <Pressable
            key={col}
            onPress={() => handlePress(col)}
            onPressIn={() => setActiveCol(col)}
            onPressOut={() => setActiveCol(null)}
            disabled={disabled}
            style={styles.column}
          >
            {Array.from({ length: ROWS }).map((__, row) => {
              const value = board[row][col];
              const showGhost = row === previewRow && value === EMPTY;
              return (
                <View key={row} style={styles.cellWrap}>
                  <Disc
                    value={value}
                    size={cellSize}
                    theme={theme}
                    highlighted={isWinningCell(row, col)}
                  />
                  {showGhost && (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.ghost,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderRadius: cellSize / 2,
                          borderColor: playerColors(theme, previewPlayer || 1).color,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    borderRadius: 18,
    alignSelf: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  cellWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    position: 'absolute',
    margin: 3,
    borderWidth: 3,
    opacity: 0.7,
  },
});

export default Board;
