# Bomberman Multiplayer Server

WebSocket server built with NestJS for real-time multiplayer gameplay.

## Features

- Real-time multiplayer with Socket.IO
- Multiple game rooms with parallel matches
- Server-authoritative game state
- 60 FPS game loop synchronization
- Player management and room allocation
- Structured logging with Pino

## Configuration

The server can be configured using environment variables. Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

### Available Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated) |
| `NODE_ENV` | `development` | Node environment |

## Installation

```bash
npm install
```

## Development

Start the server in development mode with hot reload:

```bash
npm run dev
```

## Production

Build and run in production:

```bash
npm run build
npm start
```

## Game Rooms

The server automatically creates 3 default rooms:
- Room 1
- Room 2
- Room 3

Each room can host up to 4 players and runs its own independent game loop.

## WebSocket Events

### Client → Server

- `get-room-list` - Request available rooms
- `join-room` - Join a specific room
- `leave-room` - Leave current room
- `start-game` - Start game (requires ≥2 players)
- `player-action` - Send player input (move, drop bomb)

### Server → Client

- `room-list` - List of available rooms
- `room-update` - Room state changed (players joined/left)
- `join-success` - Successfully joined room
- `join-error` - Failed to join room
- `game-started` - Game has started
- `game-state` - Game state update (60 FPS)
- `game-over` - Game finished
- `game-ended` - Game ended early (disconnect)
- `server-shutdown` - Server shutting down

## Architecture

```
server/
├── src/
│   ├── app.module.ts          # Main application module
│   ├── main.ts                # Bootstrap & configuration
│   └── game/
│       ├── game.module.ts     # Game module
│       ├── game.gateway.ts    # WebSocket gateway
│       ├── game.types.ts      # Type definitions
│       ├── game-state.ts      # Game loop & logic
│       ├── room.ts            # Room management
│       └── room-manager.ts    # Multi-room orchestration
```

## Graceful Shutdown

The server handles SIGINT and SIGTERM signals gracefully:
- Notifies all connected clients
- Waits 500ms for cleanup
- Closes all connections
- Exits cleanly
