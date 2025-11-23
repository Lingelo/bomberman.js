# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build
npm run typecheck    # Type check without emitting
npm run lint         # ESLint with auto-fix
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once
npm run preview      # Preview production build
npm run format       # Format with Prettier
```

## Architecture Overview

This is a TypeScript Bomberman game built with Vite, using HTML5 Canvas for rendering.

### State Management
Custom Redux-like store in `src/state/`:
- `redux.ts` - Simple store with `getState()`, `dispatch()`, `subscribe()`
- `reducer.ts` - Game state reducer
- `actions.ts` - Action type definitions

### Screen/Menu System
Navigation between screens via state changes:
- `src/index.ts` - Main entry, screen switching logic via Redux subscription
- `src/menus/` - Menu screens (Title, Options, Information) extend base `Menu` class
- Screen codes: `'TITLE'`, `'OPTIONS'`, `'INFORMATION'`, `'NEW_GAME'`

### Game Core (`src/game/`)
- `game.ts` - Main game loop and entity management
- `board.ts` - Grid-based game board
- `character.ts` - Player/bot entity
- `bot-ai.ts` - AI with A* pathfinding, danger zone prediction, strategic decisions
- `pathfinder.ts` - A* pathfinding implementation
- `bomb.ts`, `blast.ts`, `flame.ts` - Explosion mechanics
- `bonus.ts`, `wall.ts`, `block.ts` - Map elements

### Input Handling (`src/utils/`)
- `keyboard.ts` - Keyboard input with multiple layout support (ZQSD/WASD/ARROWS)
- `gamepad.ts` - Controller support (any gamepad can be any player P1-P4)
- `music.ts` - Audio management

### Type Definitions
- `src/types/index.ts` - Shared TypeScript interfaces (GameState, CanvasContext, etc.)

## Key Patterns

- Game loop uses `requestAnimationFrame` in `src/index.ts`
- All game entities update through a unified `update(canvasContext)` pattern
- Bot AI uses danger maps and A* pathfinding for intelligent movement
- Canvas rendering at fixed 960x640 resolution
