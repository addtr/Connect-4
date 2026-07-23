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

// Ad cadence for the shortest series, counted per *completed series* (across
// the session) rather than per game — since these series are quick, ads are
// spaced out over several of them.
export const SERIES_COMPLETION_AD_THRESHOLD = {
  1: 4, // single game: an ad every 4 completed games
  3: 2, // best of 3: an ad every 2 completed series
};

// Whether to show a post-*game* interstitial, given the series length and the
// number of games completed in the current series (including the one just
// finished). Only applies to best of 5 and up; from best of 5 an ad shows every
// 3 games (best of 5 -> only after game 3; best of 7+ -> games 3, 6, 9, ...).
export function shouldShowPostGameAd(seriesLength, gamesPlayed) {
  if (seriesLength < 5) return false;
  return gamesPlayed > 0 && gamesPlayed % 3 === 0;
}

// Whether to show an interstitial when a whole series finishes, given the series
// length and how many series of that length have been completed this session
// (including the one just finished). Only single game (every 4) and best of 3
// (every 2) use this; longer series rely on shouldShowPostGameAd instead.
export function shouldShowSeriesCompletionAd(seriesLength, seriesCompletedCount) {
  const threshold = SERIES_COMPLETION_AD_THRESHOLD[seriesLength];
  if (!threshold) return false;
  return seriesCompletedCount > 0 && seriesCompletedCount % threshold === 0;
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
