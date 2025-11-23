# Bomberman.js

A TypeScript implementation of the classic Bomberman game using HTML5 Canvas and Vite. Features intelligent bot AI with A* pathfinding and retro arcade visuals.

Resources (images and sounds) are sourced from the [Bombermaaan](http://bombermaaan.sourceforge.net/) project.

## Play Online

[Play here](https://lingelo.github.io/bomberman.js/)

## Getting Started

```bash
npm install
npm run dev
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type check
npm run test         # Run tests
```

## Controls

### Menu Navigation
| Key | Action |
|-----|--------|
| Arrow Up/Down | Navigate menu |
| Enter | Select option |
| Space | Add keyboard player (P1) |
| B | Add bot |
| Escape | Back/Reset |

### In-Game (Player 1)
| Layout | Up | Down | Left | Right | Bomb |
|--------|----|----|------|-------|------|
| Arrows | Arrow Up | Arrow Down | Arrow Left | Arrow Right | Space |
| ZQSD | Z | S | Q | D | Space |
| WASD | W | S | A | D | Space |

### Gamepad
Any connected gamepad can control any player (P1-P4). Use D-pad for movement and button to place bombs.

## Features

- Up to 4 players (human or bot)
- Smart bot AI with danger zone prediction
- Multiple keyboard layouts (ZQSD/WASD/Arrows)
- Gamepad support
- Volume control in Options menu

## Contributing

Pull requests are welcome!
