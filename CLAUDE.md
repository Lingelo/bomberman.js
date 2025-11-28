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
- `character.ts` - Player/bot entity with power-up states (hasKick, hasPunch, hasRemote, skullEffect)
- `bot-ai.ts` - AI with A* pathfinding, danger zone prediction, strategic bomb placement, remote detonation
- `pathfinder.ts` - A* pathfinding implementation
- `bomb.ts` - Bomb with sliding (kick), flying (punch), and remote detonation mechanics
- `blast.ts`, `flame.ts` - Explosion mechanics
- `bonus.ts`, `bonus-type.ts` - Power-ups (BOMB, POWER, SPEED, KICK, PUNCH, REMOTE, SKULL)
- `skull-effect.ts` - Skull curse effects (SLOW, FAST, REVERSE, CONSTIPATION, DIARRHEA)
- `wall.ts`, `block.ts` - Map elements

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
- `src/game/game.service.ts` - Service layer for room management
- `src/game/room-manager.ts` - Manages multiple game rooms
- `src/game/room.ts` - Individual room with players and game state
- `src/game/game-state.ts` - Server-side game state with physics loop
- `src/game/game.types.ts` - Shared TypeScript types (PlayerColor, PlayerAction, etc.)

### Type Definitions
- `src/types/index.ts` - Shared TypeScript interfaces (GameState, CanvasContext, etc.)

## Key Patterns

- Game loop uses `requestAnimationFrame` in `src/index.ts`
- All game entities update through a unified `update(canvasContext)` pattern
- Bot AI uses danger maps and A* pathfinding for intelligent movement
- Bot AI avoids SKULL items, prioritizes valuable power-ups, uses remote detonation strategically
- Canvas rendering at fixed 960x640 resolution
- Multiplayer uses Socket.IO for real-time bidirectional communication
- Room-based multiplayer: multiple concurrent games supported

## Power-Up System

Power-ups defined in `bonus-type.ts`, collected in `reducer.ts`:
- **KICK**: `character.hasKick` - Walk into bomb to push it (sliding in `bomb.ts`)
- **PUNCH**: `character.hasPunch` - Space on own bomb to throw it (flying arc in `bomb.ts`)
- **REMOTE**: `character.hasRemote` - Bombs don't auto-explode, Shift to detonate
- **SKULL**: Applies random curse via `skull-effect.ts` for 8 seconds (480 frames)

## Multiplayer Architecture

```
[Client] --websocket--> [NestJS Server] --broadcast--> [All Clients]
                              |
                         [RoomManager]
                         - Multiple rooms
                         - Player assignment
                              |
                          [Room]
                          - Game state
                          - Physics loop
```

### Key Events
- `get-room-list` / `room-list` - Room discovery
- `join-room` / `leave-room` - Room management
- `start-game` - Begin match (min 2 players)
- `player-action` - MOVE, STOP, DROP_BOMB, DETONATE
- `game-state` - Server broadcasts full state each tick
- `game-over` / `game-ended` - Match completion
- `server-shutdown` - Graceful shutdown notification

## Docker Deployment

```bash
docker-compose build --no-cache server  # Rebuild server image
docker-compose up -d server             # Start/restart server
docker-compose logs -f cloudflared      # Get HTTPS tunnel URL
```
