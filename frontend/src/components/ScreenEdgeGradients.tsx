import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Renders two fixed gradient overlays — one pinned to the top of the screen
 * (transparent → black) and one pinned to the bottom (black → transparent).
 * Both are purely decorative and ignore pointer events.
 */
export default function ScreenEdgeGradients() {
  return (
    <>
      {/* Top edge: transparent at top → dark at bottom */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
        style={styles.top}
        pointerEvents="none"
      />
      {/* Bottom edge: dark at top → transparent at bottom (flipped) */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
        style={styles.bottom}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 144,
    zIndex: 10,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 144,
    zIndex: 10,
  },
});
