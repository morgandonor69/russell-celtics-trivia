export default function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <button className="start-btn" onClick={onStart}>
        Start Game
      </button>
    </div>
  );
}
