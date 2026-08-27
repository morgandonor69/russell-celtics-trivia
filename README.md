# RUSSELL — The Daily Celtics Trivia Game (React)

A Wordle/Poeltl-style daily guessing game built with React + Vite. Guess the mystery Boston Celtics player in 8 tries — each guess flips over like Wordle tiles to reveal how you compare on Position, Number, Height, Celtic Debut year, and All-Star Games.

## What's animated
- Guess tiles flip (3D rotateX) top-to-bottom style, staggered column by column, just like Wordle reveals
- Logo/title bounce and pop in on load
- Invalid guesses shake the input
- Modals (help, stats, result) pop/scale in
- Autocomplete suggestions slide in, hover states animate

## Project structure
```
src/
  App.jsx              main app state + layout
  gameLogic.js          daily player selection, guess comparison logic
  players.js             player dataset (edit to add/adjust players)
  components/
    Header.jsx
    StartScreen.jsx
    GuessInput.jsx        autocomplete input
    GuessRow.jsx          a guess's row of tiles
    Tile.jsx              single flip tile
    Modal.jsx             generic modal wrapper
  index.css / App.css     styling + keyframe animations
```

## Running locally
```
npm install
npm run dev
```
Then open the printed localhost URL.

## Building
```
npm run build
```
This outputs a **single self-contained `dist/index.html`** (via `vite-plugin-singlefile`) with all JS/CSS/images inlined — you can double-click and open it directly in a browser, no server required.

## Deploying
Static site, so GitHub Pages works great:
1. Push this project to a GitHub repo.
2. Either commit the built `dist/index.html` and serve it directly, or set up a GitHub Actions workflow that runs `npm run build` and deploys `dist/`.
3. Enable GitHub Pages in repo settings.

To use a custom domain, add a `CNAME` file to `public/` with your domain and point DNS at GitHub Pages.

## Notes
- Daily player is chosen deterministically from the date, so everyone gets the same puzzle each day.
- The logo (`src/assets/logo.png`) is an original AI-generated illustration — a generic athlete silhouette, not Bill Russell's actual likeness — to avoid using a real photo without rights.
- Add more players to `src/players.js` (same object shape) to grow the puzzle pool.
