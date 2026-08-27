import { useState, useRef, useEffect } from 'react';
import { PLAYERS } from '../players.js';

export default function GuessInput({ onGuess, guessedNames, disabled }) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const wrapperRef = useRef(null);

  const matches = value.trim()
    ? PLAYERS.filter(
        (p) => p.name.toLowerCase().includes(value.trim().toLowerCase()) && !guessedNames.has(p.name)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setValue((v) => v); // no-op, just close list via matches recompute on blur
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [open, setOpen] = useState(false);

  function pick(name) {
    onGuess(name);
    setValue('');
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const match = PLAYERS.find((p) => p.name.toLowerCase() === value.trim().toLowerCase());
      if (match && !guessedNames.has(match.name)) {
        pick(match.name);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="guess-form" ref={wrapperRef}>
      <input
        type="text"
        id="playerInput"
        placeholder="Enter player name"
        autoComplete="off"
        disabled={disabled}
        value={value}
        className={shake ? 'shake' : ''}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && matches.length > 0 && (
        <div className="autocomplete-list">
          {matches.map((p) => (
            <div key={p.name} onClick={() => pick(p.name)}>
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
