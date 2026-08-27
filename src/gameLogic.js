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

// Fallback used only if the hosted schedule can't be reached (offline, etc.)
// Keeps the game playable, but the real daily answer comes from answers.json.
export function getTodaysPlayerFallback() {
  const idx = dailySeed() % PLAYERS.length;
  return PLAYERS[idx];
}

export function dateKeyRaw(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Fetches today's answer from the hosted schedule (public/answers.json),
// which acts as our once-a-day "database" of daily answers. Falls back to
// a deterministic local computation if the fetch fails for any reason.
export async function fetchTodaysPlayer() {
  try {
    const res = await fetch('./answers.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('bad response');
    const schedule = await res.json();
    const name = schedule[dateKeyRaw()];
    const player = PLAYERS.find((p) => p.name === name);
    if (player) return player;
    throw new Error('no matching player for today');
  } catch (e) {
    return getTodaysPlayerFallback();
  }
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
