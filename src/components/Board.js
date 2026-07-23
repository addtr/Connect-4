// The Connect Four board. Renders 7 tappable columns of 6 cells and reports the
// tapped column to the parent. While a column is pressed it shows an animated
// ghost disc at the landing spot so it is clear where the piece will drop.

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { ROWS, COLS, EMPTY } from '../logic/constants';
import { getDropRow, isColumnPlayable } from '../logic/board';
import { playerColors } from '../theme/themes';
import Disc from './Disc';

const CELL_MARGIN = 3;

function Board({ board, theme, onColumnPress, disabled, winningCells, previewPlayer }) {
  const { width } = useWindowDimensions();
  const [activeCol, setActiveCol] = useState(null);

  const horizontalPadding = 32;
  const boardWidth = Math.min(width - horizontalPadding, 440);
  const cellSize = Math.floor(boardWidth / COLS) - 6;
  const pitch = cellSize + CELL_MARGIN * 2;

  const isWinningCell = (r, c) =>
    !!winningCells && winningCells.some(([wr, wc]) => wr === r && wc === c);

  const handlePress = (col) => {
    if (disabled || !isColumnPlayable(board, col)) return;
    onColumnPress(col);
  };

  return (
    <View
      style={[
        styles.board,
        {
          backgroundColor: theme.boardColor,
          padding: 6,
          shadowColor: theme.boardShadow,
        },
      ]}
    >
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
              // Distance the dropped piece falls: from just above the board down
              // to this row.
              const fallDistance = pitch * (row + 1);
              return (
                <View key={row} style={styles.cellWrap}>
                  <Disc
                    value={value}
                    size={cellSize}
                    theme={theme}
                    highlighted={isWinningCell(row, col)}
                    fallDistance={fallDistance}
                  />
                  {showGhost && (
                    <GhostDisc
                      size={cellSize}
                      color={playerColors(theme, previewPlayer || 1).color}
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

// A softly pulsing outline showing where a tapped piece will land.
function GhostDisc({ size, color }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ghost,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    borderRadius: 18,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
    borderWidth: 3,
  },
});

export default Board;
