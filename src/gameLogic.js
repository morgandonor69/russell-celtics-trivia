import { PLAYERS } from './players.js';
import { supabase } from './supabaseClient.js';

export const MAX_GUESSES = 8;

// --- Live database (Supabase) ---
// Players and the daily answer are both stored in Supabase, so the roster
// and the day's puzzle can be updated any time from the dashboard without
// a new deploy. We fall back to the bundled static data if the DB is
// unreachable, so the game never breaks.
export async function fetchPlayersFromDB() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('players').select('*').order('id');
    if (error || !data || data.length === 0) return null;
    return data.map((row) => ({
      name: row.name,
      position: row.position,
      number: row.number,
      heightIn: row.height_in,
      heightStr: row.height_str,
      debut: row.debut,
      allStar: row.all_star,
    }));
  } catch (e) {
    return null;
  }
}

export async function fetchTodaysAnswerNameFromDB() {
  if (!supabase) return null;
  try {
    const iso = dateKeyISO();
    const { data, error } = await supabase
      .from('daily_puzzle')
      .select('players(name)')
      .eq('date', iso)
      .single();
    if (error || !data?.players?.name) return null;
    return data.players.name;
  } catch (e) {
    return null;
  }
}

export function dateKeyISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// Resolves today's answer, trying the live Supabase database first, then
// the static hosted schedule (public/answers.json), then a deterministic
// local computation as a last resort. `playerList` should be whichever
// roster is currently loaded (DB roster if available, else the static one).
export async function fetchTodaysPlayer(playerList = PLAYERS) {
  const dbName = await fetchTodaysAnswerNameFromDB();
  if (dbName) {
    const player = playerList.find((p) => p.name === dbName);
    if (player) return player;
  }

  try {
    const res = await fetch('./answers.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('bad response');
    const schedule = await res.json();
    const name = schedule[dateKeyRaw()];
    const player = playerList.find((p) => p.name === name);
    if (player) return player;
    throw new Error('no matching player for today');
  } catch (e) {
    const idx = dailySeed() % playerList.length;
    return playerList[idx];
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

export function arrowFor(guessVal, targetVal, closeRange = 0) {
  if (guessVal === targetVal) return { status: 'correct', arrow: '' };
  const status = Math.abs(guessVal - targetVal) <= closeRange ? 'partial' : 'wrong';
  return { status, arrow: guessVal < targetVal ? 'up' : 'down' };
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
  const numInfo = arrowFor(guess.number, target.number, 5);
  const heightInfo = arrowFor(guess.heightIn, target.heightIn, 3);
  const debutInfo = arrowFor(guess.debut, target.debut, 5);
  const allStarInfo = arrowFor(guess.allStar, target.allStar, 3);

  return [
    { key: 'name', label: guess.name, status: guess.name === target.name ? 'correct' : 'wrong', arrow: '' },
    { key: 'position', label: guess.position.join('/'), status: posStatus, arrow: '' },
    { key: 'number', label: String(guess.number), status: numInfo.status, arrow: numInfo.arrow },
    { key: 'height', label: guess.heightStr, status: heightInfo.status, arrow: heightInfo.arrow },
    { key: 'debut', label: String(guess.debut), status: debutInfo.status, arrow: debutInfo.arrow },
    { key: 'allStar', label: String(guess.allStar), status: allStarInfo.status, arrow: allStarInfo.arrow },
  ];
}
