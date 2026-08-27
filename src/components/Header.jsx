export default function Header({ onHelp, onStats }) {
  return (
    <div className="top-bar">
      <button onClick={onHelp} className="icon-btn">?</button>
      <span className="top-bar-title">RUSSELL</span>
      <button onClick={onStats} className="icon-btn">📊</button>
    </div>
  );
}
