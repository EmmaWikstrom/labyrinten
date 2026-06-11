# aMAZEing minds

aMAZEing Minds is a 3D quiz maze game where players choose a grade level and school subject, explore a maze, and answer questions to unlock the exit. The game works both in a standard 2D web browser and in VR headsets, built with A-Frame and Vite.

---

## Features

- 3D maze gameplay with question-based progression
- Locked exit that opens after all questions are answered
- Grade and subject selection (Math, Swedish, English, Natural Science, Social Science, History)
- Dynamic question triggers placed throughout the maze
- Multiple levels with increasing difficulty
- Works in both desktop web and VR (A-Frame)

---

## Getting Started

IInstall dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the URL shown in the terminal (usually):

http://localhost:5173

---

## How to Play (Web)

- Choose your grade level and subject on the start screen
- Click “Starta spelet”
- Move using WASD or arrow keys
- Look around using the mouse
- Walk over markers to trigger questions
- Answer questions to progress
- Unlock the exit when all questions are completed
- Find the exit to complete the level

---

## How to Play (VR)

- Choose your grade level and subject on the start screen
- Click “Starta spelet”
- Use your headset to look around
- Interact with objects using VR controls (controller or gaze depending on device)
- Walk over markers to trigger questions
- Answer questions to progress
- Unlock the exit when all questions are completed
- Find the exit to complete the level --

## Edit Content

### Questions

Questions and answers are stored in:

js/questions.js

### Levels

Maze layouts, start positions, exits, and question triggers are defined in:

js/levels.js

### Player Logic

Movement and question interaction logic:

js/components/player-controller.js

### Maze Generation

3D maze construction logic:

js/components/maze-builder.js

---

## Possible implementations

- Let students practice specific topics or exams instead of random questions
- Allow teachers to create and upload their own question sets
- Show player progress across levels and subjects (what has been completed and practiced)
- Add a leaderboard based on completion time and performance
- Add multiplayer mode where classmates can play and answer questions together
- Generate questions from study material (text or images) to support custom practice

---

## Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
