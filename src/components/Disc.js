// A single disc/cell rendered inside the board grid. Pass one draws a static
// disc; pass two will layer drop animation and winning-cell glow on top.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EMPTY } from '../logic/constants';
import { playerColors } from '../theme/themes';

function Disc({ value, size, theme, highlighted }) {
  const inner =
    value === EMPTY
      ? { backgroundColor: theme.emptyCell }
      : {
          backgroundColor: playerColors(theme, value).color,
        };

  const highlightStyle = highlighted
    ? {
        borderWidth: 3,
        borderColor: '#ffffff',
      }
    : null;

  return (
    <View
      style={[
        styles.cell,
        { width: size, height: size, borderRadius: size / 2 },
        inner,
        highlightStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    margin: 3,
  },
});

export default Disc;
