import Tile from './Tile.jsx';
import { buildRowCells } from '../gameLogic.js';

// Tiles flip one at a time, in order — each one waits for the previous to finish.
export const FLIP_DURATION_MS = 500;

export default function GuessRow({ guess, target, animate }) {
  const cells = buildRowCells(guess, target);
  return (
    <tr className={animate ? 'row-in' : ''}>
      {cells.map((cell, i) => (
        <td key={cell.key} className="cell-wrapper">
          <Tile
            label={cell.label}
            status={cell.status}
            arrow={cell.arrow}
            delay={animate ? i * FLIP_DURATION_MS : 0}
            isName={cell.key === 'name'}
          />
        </td>
      ))}
    </tr>
  );
}

export function EmptyRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="cell-wrapper">
          <div className="tile-empty" />
        </td>
      ))}
    </tr>
  );
}
