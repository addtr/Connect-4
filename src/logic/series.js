// "Best of N" match logic: scoring across multiple games and picking who starts
// each game. Pure and UI-agnostic so it can be unit tested.

import { PLAYER_ONE, PLAYER_TWO } from './constants';

// Series lengths offered in settings. 1 is a single game; the rest are odd so
// there is always a decider.
export const SERIES_OPTIONS = [1, 3, 5, 7, 9, 11, 15, 21];
export const DEFAULT_SERIES_LENGTH = 3;

// Display label for a series length.
export function seriesLabel(n) {
  return n === 1 ? 'Single game' : `Best of ${n}`;
}

// Who takes the first move in a vs-bot game.
export const START_PREFERENCE = {
  YOU: 'YOU',
  BOT: 'BOT',
  RANDOM: 'RANDOM',
};
export const DEFAULT_START_PREFERENCE = START_PREFERENCE.YOU;

// Games needed to clinch a best-of-N series (first to a majority).
export function winsNeeded(seriesLength) {
  return Math.floor(seriesLength / 2) + 1;
}

// Fresh match/series state.
export function createMatch(seriesLength = DEFAULT_SERIES_LENGTH) {
  return {
    seriesLength,
    target: winsNeeded(seriesLength),
    scoreP1: 0,
    scoreP2: 0,
    gamesPlayed: 0,
    seriesWinner: null, // PLAYER_ONE / PLAYER_TWO once the series is decided
  };
}

// Fold a finished game's result into the match. `winner` is a player id, or
// null for a draw (draws count as a played game but award no point). Returns a
// NEW match object.
export function recordGameResult(match, winner) {
  const scoreP1 = match.scoreP1 + (winner === PLAYER_ONE ? 1 : 0);
  const scoreP2 = match.scoreP2 + (winner === PLAYER_TWO ? 1 : 0);
  let seriesWinner = null;
  if (scoreP1 >= match.target) seriesWinner = PLAYER_ONE;
  else if (scoreP2 >= match.target) seriesWinner = PLAYER_TWO;

  return {
    ...match,
    scoreP1,
    scoreP2,
    gamesPlayed: match.gamesPlayed + 1,
    seriesWinner,
  };
}

export function isSeriesOver(match) {
  return match.seriesWinner !== null;
}

// Whether to show a post-game interstitial, given the series length and the
// number of games completed so far (including the one just finished).
//
// Short series (single game / best of 3) never show post-game ads. From best of
// 5 up, an ad shows every 3 games — which for best of 5 means only after game 3,
// and for best of 7+ means after games 3, 6, 9, ... (The return-to-menu and
// extra-undo ads are separate from this.)
export function shouldShowPostGameAd(seriesLength, gamesPlayed) {
  if (seriesLength < 5) return false;
  return gamesPlayed > 0 && gamesPlayed % 3 === 0;
}

// Resolve who moves first in a vs-bot game, given the player's preference.
// Human is Player One, bot is Player Two.
export function resolveVsBotStarter(preference) {
  switch (preference) {
    case START_PREFERENCE.YOU:
      return PLAYER_ONE;
    case START_PREFERENCE.BOT:
      return PLAYER_TWO;
    case START_PREFERENCE.RANDOM:
    default:
      return Math.random() < 0.5 ? PLAYER_ONE : PLAYER_TWO;
  }
}

// In pass-and-play we simply alternate who starts each game across the series
// (game 0 -> Player One, game 1 -> Player Two, ...).
export function passAndPlayStarter(gamesPlayed) {
  return gamesPlayed % 2 === 0 ? PLAYER_ONE : PLAYER_TWO;
}
