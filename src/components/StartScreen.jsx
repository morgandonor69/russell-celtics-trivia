import logo from '../assets/logo.png';

export default function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <img src={logo} alt="Bill Russell" className="hero-logo" />
      <button className="start-btn" onClick={onStart}>
        Start Game
      </button>
    </div>
  );
}
