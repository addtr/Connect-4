// Ads backbone: full-screen interstitials + a shared entitlement gate.
//
// Real ads (Google AdMob via react-native-google-mobile-ads) only run in a
// native build, never in Expo Go, and need an AdMob account + ad unit IDs. So
// this provider models the interstitial *flow* with a placeholder overlay that
// runs anywhere, and marks exactly where the real SDK plugs in. When ad-free is
// purchased, every ad call becomes a no-op.
//
// Interstitials are shown on: pressing Undo, pressing Menu mid-game, and after
// every finished game — matching the app's ad design.

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { usePurchases } from './purchases';

// Seconds before the interstitial can be dismissed (real AdMob interstitials
// similarly gate the close button briefly).
const SKIP_DELAY = 3;

// Minimum gap between interstitials, so distinct triggers firing close together
// (e.g. the post-game ad and then tapping Menu) don't stack two ads in a row.
const COOLDOWN_MS = 2500;

const AdsContext = createContext(null);

export function AdsProvider({ children }) {
  const { isAdFree } = usePurchases();
  const [visible, setVisible] = useState(false);
  const resolverRef = useRef(null);
  const lastShownRef = useRef(0);
  // Count of completed series per length, kept for the whole session (survives
  // leaving and re-entering the game screen) so the "every N series" ad cadence
  // for short series works.
  const seriesCountsRef = useRef({});

  // Record that a series of the given length just finished; returns the new
  // session total for that length.
  const noteSeriesComplete = useCallback((seriesLength) => {
    const next = (seriesCountsRef.current[seriesLength] || 0) + 1;
    seriesCountsRef.current[seriesLength] = next;
    return next;
  }, []);

  // Show an interstitial and resolve once it is dismissed. No-op (immediate
  // resolve) when the user has removed ads or one was just shown.
  const showInterstitial = useCallback(() => {
    if (isAdFree) return Promise.resolve();
    if (Date.now() - lastShownRef.current < COOLDOWN_MS) return Promise.resolve();
    // TODO(native build): load & present a real InterstitialAd here; resolve on
    // its 'closed' event instead of the placeholder modal.
    lastShownRef.current = Date.now();
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setVisible(true);
    });
  }, [isAdFree]);

  const handleClose = useCallback(() => {
    setVisible(false);
    lastShownRef.current = Date.now();
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (resolve) resolve();
  }, []);

  return (
    <AdsContext.Provider value={{ showInterstitial, isAdFree, noteSeriesComplete }}>
      {children}
      <InterstitialPlaceholder visible={visible} onClose={handleClose} />
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used within an AdsProvider');
  return ctx;
}

// Placeholder interstitial: a dark full-screen overlay with a short countdown
// before a close button appears, standing in for a real interstitial creative.
function InterstitialPlaceholder({ visible, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(SKIP_DELAY);

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(SKIP_DELAY);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [visible]);

  const canClose = secondsLeft === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.adBackdrop}>
        <View style={styles.adCard}>
          <Text style={styles.adTag}>Advertisement</Text>
          <ActivityIndicator color="#8b8fa8" style={{ marginVertical: 18 }} />
          <Text style={styles.adPlaceholderText}>Your ad could be here</Text>
          <Text style={styles.adHint}>Remove ads in Settings</Text>
        </View>

        <Pressable
          onPress={canClose ? onClose : undefined}
          style={[styles.adClose, { opacity: canClose ? 1 : 0.5 }]}
          disabled={!canClose}
        >
          <Text style={styles.adCloseText}>
            {canClose ? 'Close ✕' : `Close in ${secondsLeft}s`}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  adBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  adCard: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#1a1c28',
    borderWidth: 1,
    borderColor: '#2a2d3d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  adTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#6f7488',
    textTransform: 'uppercase',
  },
  adPlaceholderText: {
    color: '#c9ccd8',
    fontSize: 20,
    fontWeight: '700',
  },
  adHint: {
    color: '#6f7488',
    fontSize: 13,
    marginTop: 8,
  },
  adClose: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#ffffff',
  },
  adCloseText: {
    color: '#12203a',
    fontSize: 16,
    fontWeight: '800',
  },
});
