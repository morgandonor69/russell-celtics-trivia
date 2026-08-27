import { PLAYERS } from './players.js';

export const MAX_GUESSES = 8;

export function dailySeed() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTodaysPlayer() {
  const idx = dailySeed() % PLAYERS.length;
  return PLAYERS[idx];
}

export function todayKey() {
  const t = new Date();
  return `russell-${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
}

export function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
export function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
}

export function loadStats() {
  const raw = safeGet('russell-stats');
  return raw ? JSON.parse(raw) : { played: 0, wins: 0, currentStreak: 0, maxStreak: 0 };
}
export function saveStats(stats) {
  safeSet('russell-stats', JSON.stringify(stats));
}

export function arrowFor(guessVal, targetVal) {
  if (guessVal === targetVal) return { status: 'correct', arrow: '' };
  return { status: 'wrong', arrow: guessVal < targetVal ? 'up' : 'down' };
}

export function positionResult(guessPos, targetPos) {
  const exact = guessPos.length === targetPos.length && guessPos.every(p => targetPos.includes(p));
  if (exact) return 'correct';
  const overlap = guessPos.some(p => targetPos.includes(p));
  if (overlap) return 'partial';
  return 'wrong';
}

// Builds the ordered list of cell results for a guess row
export function buildRowCells(guess, target) {
  const posStatus = positionResult(guess.position, target.position);
  const numInfo = arrowFor(guess.number, target.number);
  const heightInfo = arrowFor(guess.heightIn, target.heightIn);
  const debutInfo = arrowFor(guess.debut, target.debut);
  const allStarInfo = arrowFor(guess.allStar, target.allStar);

  return [
    { key: 'name', label: guess.name, status: guess.name === target.name ? 'correct' : 'wrong', arrow: '' },
    { key: 'position', label: guess.position.join('/'), status: posStatus, arrow: '' },
    { key: 'number', label: String(guess.number), status: numInfo.status, arrow: numInfo.arrow },
    { key: 'height', label: guess.heightStr, status: heightInfo.status, arrow: heightInfo.arrow },
    { key: 'debut', label: String(guess.debut), status: debutInfo.status, arrow: debutInfo.arrow },
    { key: 'allStar', label: String(guess.allStar), status: allStarInfo.status, arrow: allStarInfo.arrow },
  ];
}
