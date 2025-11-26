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

### Multiplayer Commands

```bash
npm run server:install   # Install server dependencies
npm run server:dev       # Start NestJS multiplayer server
npm run server:build     # Build server for production
npm run server:start     # Start production server
npm run multiplayer      # Start frontend + server together
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
- `src/menus/` - Menu screens (Title, Options, Information, Lobby) extend base `Menu` class
- Screen codes: `'TITLE'`, `'OPTIONS'`, `'INFORMATION'`, `'LOBBY'`, `'NEW_GAME'`, `'MULTIPLAYER_GAME'`

### Game Core (`src/game/`)
- `game.ts` - Main game loop and entity management (solo/AI mode)
- `multiplayer-game.ts` - Multiplayer game with network synchronization
- `board.ts` - Grid-based game board
- `character.ts` - Player/bot entity
- `bot-ai.ts` - AI with A* pathfinding, danger zone prediction, strategic decisions
- `pathfinder.ts` - A* pathfinding implementation
- `bomb.ts`, `blast.ts`, `flame.ts` - Explosion mechanics
- `bonus.ts`, `wall.ts`, `block.ts` - Map elements

### Input Handling (`src/utils/`)
- `keyboard.ts` - Keyboard input with multiple layout support (ZQSD/WASD/ARROWS)
- `gamepad.ts` - Controller support (any gamepad can be any player P1-P4)
- `network.ts` - Socket.IO client for multiplayer communication
- `music.ts` - Audio management

### Multiplayer Server (`server/`)
NestJS WebSocket server for online multiplayer:
- `src/main.ts` - Entry point with graceful shutdown
- `src/app.module.ts` - Main module with Pino logging
- `src/game/game.gateway.ts` - WebSocket gateway handling all events
- `src/game/game.service.ts` - Lobby and game state management
- `src/game/game.types.ts` - Shared TypeScript types

### Type Definitions
- `src/types/index.ts` - Shared TypeScript interfaces (GameState, CanvasContext, etc.)

## Key Patterns

- Game loop uses `requestAnimationFrame` in `src/index.ts`
- All game entities update through a unified `update(canvasContext)` pattern
- Bot AI uses danger maps and A* pathfinding for intelligent movement
- Canvas rendering at fixed 960x640 resolution
- Multiplayer uses Socket.IO for real-time bidirectional communication
- Single lobby model: one game at a time on the server

## Multiplayer Architecture

```
[Client] --websocket--> [NestJS Server] --broadcast--> [All Clients]
                              |
                         [GameService]
                         - Single lobby
                         - Player management
                         - Game state
```

### Key Events
- `join-lobby` / `leave-lobby` - Lobby management
- `start-game` - Begin multiplayer match
- `player-action` - Movement and bomb placement
- `game-ended` / `game-over` - Match completion
- `server-shutdown` - Graceful server shutdown notification
