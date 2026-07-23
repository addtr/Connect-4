// Sound + haptic feedback service.
//
// Sounds are preloaded once and replayed on demand. Everything is wrapped in
// try/catch and gated on the caller's enabled flags so it degrades gracefully
// on the web / simulator (where haptics are a no-op) and never interrupts play.

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const SOUND_FILES = {
  drop: require('../../assets/sounds/drop.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  win: require('../../assets/sounds/win.wav'),
  draw: require('../../assets/sounds/draw.wav'),
};

const sounds = {};
let initialized = false;
let initializing = null;

// Load all sound effects. Safe to call multiple times.
export async function initFeedback() {
  if (initialized) return;
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      await Promise.all(
        Object.entries(SOUND_FILES).map(async ([key, mod]) => {
          const { sound } = await Audio.Sound.createAsync(mod, {
            volume: key === 'tap' ? 0.4 : 0.8,
          });
          sounds[key] = sound;
        }),
      );
      initialized = true;
    } catch (e) {
      // Audio is best-effort; swallow so gameplay is never blocked.
      initialized = true;
    }
  })();

  return initializing;
}

async function play(key) {
  const sound = sounds[key];
  if (!sound) return;
  try {
    await sound.replayAsync();
  } catch (e) {
    // ignore playback hiccups
  }
}

// --- Sound effects (gated on soundEnabled) ---
export function playDrop(soundEnabled) {
  if (soundEnabled) play('drop');
}
export function playTap(soundEnabled) {
  if (soundEnabled) play('tap');
}
export function playWin(soundEnabled) {
  if (soundEnabled) play('win');
}
export function playDraw(soundEnabled) {
  if (soundEnabled) play('draw');
}

// --- Haptics (gated on hapticsEnabled; iOS/Android only) ---
function canHaptic() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function hapticDrop(hapticsEnabled) {
  if (!hapticsEnabled || !canHaptic()) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    /* no-op */
  }
}

export function hapticWin(hapticsEnabled) {
  if (!hapticsEnabled || !canHaptic()) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    /* no-op */
  }
}

export function hapticDraw(hapticsEnabled) {
  if (!hapticsEnabled || !canHaptic()) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    /* no-op */
  }
}

// Optional cleanup (not strictly required for an always-on game app).
export async function unloadFeedback() {
  await Promise.all(
    Object.values(sounds).map((s) => s.unloadAsync().catch(() => {})),
  );
  Object.keys(sounds).forEach((k) => delete sounds[k]);
  initialized = false;
  initializing = null;
}
