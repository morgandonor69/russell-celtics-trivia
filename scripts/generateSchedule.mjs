// Generates public/answers.json: a date -> player-name schedule.
// This acts as our lightweight "daily answer database" — the app fetches
// this file at runtime instead of computing the answer purely on the client,
// so the day's answer isn't just sitting in the JS bundle.
//
// Players cycle through in a shuffled order (reshuffled each full cycle so
// nobody repeats until everyone's had a turn), seeded per-cycle so the
// schedule is reproducible.
import { PLAYERS } from '../src/players.js';
import { writeFileSync } from 'node:fs';

const START_DATE = new Date('2025-01-01T00:00:00');
const NUM_DAYS = 365 * 4; // 4 years of daily answers

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffle(arr, seed) {
  const rand = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const schedule = {};
let cycle = 0;
let order = shuffle(PLAYERS, 42);
let idx = 0;

for (let i = 0; i < NUM_DAYS; i++) {
  if (idx >= order.length) {
    cycle += 1;
    order = shuffle(PLAYERS, 42 + cycle * 977);
    idx = 0;
  }
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + i);
  schedule[dateKey(d)] = order[idx].name;
  idx += 1;
}

writeFileSync(new URL('../public/answers.json', import.meta.url), JSON.stringify(schedule));
console.log(`Wrote ${Object.keys(schedule).length} daily answers to public/answers.json`);
