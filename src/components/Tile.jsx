import { useEffect, useState } from 'react';

const STATUS_COLORS = {
  correct: 'var(--correct)',
  partial: 'var(--close)',
  wrong: 'var(--wrong)',
};

const ARROW_SYMBOL = { up: '▲', down: '▼', '': '' };

// A single flippable cell, styled like a Wordle tile.
// The front face stays blank/neutral until this tile's turn comes up,
// then it flips to reveal the colored result — one tile at a time.
export default function Tile({ label, status, arrow, delay, isName }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 50 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const textColor = status === 'wrong' ? '#222' : '#fff';

  return (
    <div className={`tile-3d${isName ? ' tile-3d-name' : ''}`} style={{ perspective: 600 }}>
      <div
        className="tile-inner"
        style={{
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
          transition: `transform 0.25s ease-in`,
          transitionDelay: `${delay}ms`,
        }}
      >
        <div className="tile-face tile-front" aria-hidden="true" />
        <div
          className={`tile-face tile-back${isName ? ' tile-name' : ''}`}
          style={{ background: STATUS_COLORS[status], color: textColor, textAlign: isName ? 'left' : 'center' }}
        >
          {label}{arrow ? <span className="arrow-symbol">{ARROW_SYMBOL[arrow]}</span> : null}
        </div>
      </div>
    </div>
  );
}
