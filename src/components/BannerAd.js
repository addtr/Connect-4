// Bottom banner ad slot.
//
// Renders a placeholder bar in Expo Go; in a native build, drop a real AdMob
// <BannerAd /> (react-native-google-mobile-ads) in place of the placeholder.
// Renders nothing when the user has purchased Remove Ads.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePurchases } from '../services/purchases';
import { useSettings } from '../state/SettingsContext';

function BannerAd() {
  const { isAdFree } = usePurchases();
  const { theme } = useSettings();

  if (isAdFree) return null;

  // TODO(native build): replace this placeholder with a real AdMob banner:
  //   <BannerAd unitId={UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
  return (
    <View style={[styles.banner, { backgroundColor: theme.boardShadow }]}>
      <Text style={[styles.tag, { color: theme.textMuted }]}>Advertisement</Text>
      <Text style={[styles.label, { color: theme.text }]}>Banner ad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tag: {
    position: 'absolute',
    top: 4,
    left: 10,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BannerAd;
