import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import logo from './assets/logo.png';
import { PLAYERS as STATIC_PLAYERS } from './players.js';
import {
  MAX_GUESSES,
  fetchTodaysPlayer,
  fetchPlayersFromDB,
  todayKey,
  safeGet,
  safeSet,
  loadStats,
  saveStats,
  buildRowCells,
} from './gameLogic.js';
import Header from './components/Header.jsx';
import StartScreen from './components/StartScreen.jsx';
import GuessInput from './components/GuessInput.jsx';
import GuessRow, { EmptyRow, FLIP_DURATION_MS } from './components/GuessRow.jsx';
import Modal from './components/Modal.jsx';

export default function App() {
  const [players, setPlayers] = useState(STATIC_PLAYERS);
  const [target, setTarget] = useState(null);
  const [started, setStarted] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [newestIsAnimating, setNewestIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const messageTimeout = useRef(null);

  // Load the roster from the live database (falls back to the bundled
  // static list if Supabase is unreachable), then resolve today's answer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dbPlayers = await fetchPlayersFromDB();
      const roster = dbPlayers && dbPlayers.length > 0 ? dbPlayers : STATIC_PLAYERS;
      if (cancelled) return;
      setPlayers(roster);
      const p = await fetchTodaysPlayer(roster);
      if (!cancelled) setTarget(p);
    })();
    return () => { cancelled = true; };
  }, []);

  // Once we know today's player, restore any progress saved earlier today
  // (e.g. two guesses already made before a refresh) and jump straight back in.
  useEffect(() => {
    if (!target) return;
    const saved = safeGet(todayKey());
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const restored = data.guesses.map((n) => players.find((p) => p.name === n)).filter(Boolean);
      if (restored.length === 0) return;
      setGuesses(restored);
      setGameOver(data.gameOver);
      setStarted(true);
      if (data.gameOver) {
        const didWin = restored.some((g) => g.name === target.name);
        setWon(didWin);
        setShowResult(true);
      }
    } catch (e) { /* ignore corrupt storage */ }
  }, [target]);

  function flashMessage(msg) {
    setMessage(msg);
    clearTimeout(messageTimeout.current);
    messageTimeout.current = setTimeout(() => setMessage(''), 2500);
  }

  function handleGuess(name) {
    if (gameOver) return;
    const player = players.find((p) => p.name === name);
    if (!player) return;
    if (guesses.some((g) => g.name === player.name)) {
      flashMessage('Already guessed that player.');
      return;
    }
    const nextGuesses = [...guesses, player];
    setGuesses(nextGuesses);
    setNewestIsAnimating(true);

    safeSet(todayKey(), JSON.stringify({ guesses: nextGuesses.map((g) => g.name), gameOver: false }));

    const didWin = player.name === target.name;
    const isLast = nextGuesses.length >= MAX_GUESSES;

    if (didWin || isLast) {
      // Wait for the flip animation to finish before showing the modal
      setTimeout(() => {
        setGameOver(true);
        setWon(didWin);
        const stats = loadStats();
        stats.played += 1;
        if (didWin) {
          stats.wins += 1;
          stats.currentStreak += 1;
          stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        } else {
          stats.currentStreak = 0;
        }
        saveStats(stats);
        safeSet(todayKey(), JSON.stringify({ guesses: nextGuesses.map((g) => g.name), gameOver: true }));
        setShowResult(true);
      }, 6 * FLIP_DURATION_MS + 600);
    }
  }

  function handleShare() {
    const grid = guesses
      .map((g) => {
        const cells = buildRowCells(g, target);
        return cells
          .map((c) => (c.status === 'correct' ? '🟩' : c.status === 'partial' ? '🟨' : '⬜'))
          .join('');
      })
      .join('\n');
    const text = `RUSSELL 🍀 ${guesses.length}/${MAX_GUESSES}\n${grid}`;
    navigator.clipboard?.writeText(text);
    flashMessage('Result copied to clipboard!');
  }

  const guessedNames = useMemo(() => new Set(guesses.map((g) => g.name)), [guesses]);
  const stats = loadStats();

  return (
    <>
      <Header onHelp={() => setShowHelp(true)} onStats={() => setShowStats(true)} />

      <header className="game-header">
        {started && <img src={logo} alt="Russell logo" className="logo" />}
        <h1 className="title">RUSSELL</h1>
        <div className="subtitle">CAN YOU GUESS TODAY'S CELTIC?</div>
      </header>

      {!target ? (
        <div className="start-screen">
          <div className="loading-text">Loading today's puzzle…</div>
        </div>
      ) : !started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <div className="game-screen">
          <GuessInput players={players} onGuess={handleGuess} guessedNames={guessedNames} disabled={gameOver} />
          <div className="guess-counter">
            {!gameOver && `Guesses remaining: ${MAX_GUESSES - guesses.length}`}
          </div>
          <div className="message">{message}</div>

          <div className="board">
            <h2>GUESSES</h2>
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>POSITION</th>
                  <th>NUMBER</th>
                  <th>HEIGHT</th>
                  <th>CELTIC DEBUT</th>
                  <th>ALL-STAR GAMES</th>
                </tr>
              </thead>
              <tbody>
                {[...guesses].reverse().map((g, idx) => (
                  <GuessRow
                    key={g.name}
                    guess={g}
                    target={target}
                    animate={idx === 0 && newestIsAnimating}
                  />
                ))}
                {Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
                  <EmptyRow key={`empty-${i}`} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer>Fan-made tribute game. Not affiliated with the NBA or Boston Celtics.</footer>

      <Modal show={showResult} onClose={() => setShowResult(false)}>
        <h2 className={won ? 'win-title' : ''}>{won ? 'You got it! 🍀' : 'Better luck tomorrow'}</h2>
        <p>
          {won
            ? `You found ${target?.name} in ${guesses.length} guess${guesses.length > 1 ? 'es' : ''}.`
            : `The answer was ${target?.name}.`}
        </p>
        <button onClick={handleShare}>Copy Result</button>
        <br />
        <button className="secondary" onClick={() => setShowResult(false)}>Close</button>
      </Modal>

      <Modal show={showHelp} onClose={() => setShowHelp(false)}>
        <h2>How to Play</h2>
        <p style={{ textAlign: 'left' }}>Guess today's mystery Celtics player in 8 tries.</p>
        <p style={{ textAlign: 'left' }}>After each guess, the tiles flip to reveal how you compare:</p>
        <ul style={{ textAlign: 'left' }}>
          <li><b>Green</b> = exact match</li>
          <li><b>Gold</b> = close! Shares a position, or is within 5 for number, 3 inches for height, 5 years for Celtic debut, or 3 for All-Star games</li>
          <li><b>Arrows (▲/▼)</b> = the mystery player's number/height/debut year/All-Star count is higher or lower than your guess</li>
        </ul>
        <button onClick={() => setShowHelp(false)}>Got it</button>
      </Modal>

      <Modal show={showStats} onClose={() => setShowStats(false)}>
        <h2>Stats</h2>
        <p>Played: {stats.played}</p>
        <p>Wins: {stats.wins}</p>
        <p>Current Streak: {stats.currentStreak}</p>
        <p>Max Streak: {stats.maxStreak}</p>
        <button onClick={() => setShowStats(false)}>Close</button>
      </Modal>
    </>
  );
}
