# aMAZEing Minds

aMAZEing Minds is a web-based quiz game where the player chooses their grade level and school subject, walks through a 3D maze, and answers questions to unlock the exit. It is built to work both as a 2D web experience and as an immersive experience for VR headsets. The game is built with A-Frame and runs with Vite.

## Features

- 3D maze in the browser
- Designed for both 2D web platforms and VR headsets
- Grade and subject selection before starting the game
- Options for Math, Swedish, English, Natural and Social Science subjects
- Questions that appear when the player walks over marked spots
- Multiple levels with increasing maze size
- Locked exit that opens when all questions on the level have been answered

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the address shown by Vite in the terminal, usually:

```text
http://localhost:5173
```

## How to Play

1. Choose your grade level and subject on the start screen.
2. Click `Starta spelet`.
3. Use `WASD` or the arrow keys to move.
4. Use the mouse to look around.
5. Walk over the yellow markers and answer questions.
6. When all questions are complete, find the yellow exit.

## Edit Content

- Questions and answers are in `js/questions.js`.
- Mazes, start positions, exits, and question spots are in `js/levels.js`.
- Player movement and question logic are in `js/components/player-controller.js`.
- The 3D maze building logic is in `js/components/maze-builder.js`.

## Next Steps

- Add the possibility to study for specific tests or exams.
- Let players choose question sets connected to a specific course, chapter, or learning goal.
- Add progress tracking so players can see what they have practiced and what they need to repeat.
- Add a leaderboard for scores and completion times.
- Add the possibility to play together with classmates.

## Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
