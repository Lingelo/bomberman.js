# Bomberman.js

A TypeScript implementation of the classic Bomberman game using HTML5 Canvas and Vite. Features intelligent bot AI with A* pathfinding, retro 80s/90s arcade visuals, and online multiplayer support.

Resources (images and sounds) are sourced from the [Bombermaaan](http://bombermaaan.sourceforge.net/) project.

## Play Online

[Play here](https://lingelo.github.io/bomberman.js/)

## Quick Start

### Frontend Only (Solo + Local Multiplayer)

```bash
npm install
npm run dev
```

Open http://localhost:4200/bomberman.js/

### Frontend + Backend (Online Multiplayer)

```bash
# Terminal 1: Start the server
npm run server:install
npm run server:dev

# Terminal 2: Start the frontend
npm run dev
```

Or run both together:

```bash
npm run multiplayer
```

## Game Features

### Game Modes

- **Solo**: Play against up to 3 bots with intelligent AI
- **Local Multiplayer**: Up to 4 players on the same keyboard/gamepads
- **Online Multiplayer**: Up to 4 players over the network

### Power-Ups

| Item | Effect |
|------|--------|
| **Bomb** | +1 bomb capacity |
| **Fire** | +1 explosion range |
| **Speed** | Move faster |
| **Kick** | Push bombs by walking into them |
| **Punch** | Throw bombs over obstacles (press Space on your bomb) |
| **Remote** | Manual detonation with Shift (bombs don't auto-explode) |
| **Skull** | Random 8-second curse! |

### Skull Curses

When you pick up a skull, you get one of these effects for 8 seconds:

- **Slow**: Move at reduced speed
- **Fast**: Move uncontrollably fast
- **Reverse**: Controls are inverted
- **Constipation**: Cannot place bombs
- **Diarrhea**: Bombs drop automatically

### Bot AI

The bots use advanced AI with:

- **A* Pathfinding**: Optimal route calculation
- **Danger Zone Prediction**: Avoids bomb blast areas
- **Strategic Bomb Placement**: Targets players and destructible walls
- **Power-Up Prioritization**: Collects valuable items, avoids skulls
- **Remote Detonation**: Uses remote bombs strategically

## Controls

### Menu

| Key | Action |
|-----|--------|
| Arrow Up/Down | Navigate menu |
| Enter | Select option |
| Space | Add keyboard player (P1) |
| B | Add bot |
| Escape | Back/Reset |

### In-Game

| Layout | Up | Down | Left | Right | Bomb | Detonate |
|--------|----|----|------|-------|------|----------|
| Arrows | Arrow Up | Arrow Down | Arrow Left | Arrow Right | Space | Shift |
| ZQSD | Z | S | Q | D | Space | Shift |
| WASD | W | S | A | D | Space | Shift |

### Special Moves

- **Kick**: Walk into your bomb to push it (requires Kick power-up)
- **Punch**: Press Space while standing on your bomb to throw it (requires Punch power-up)
- **Remote**: Your bombs wait for Shift to explode (requires Remote power-up)

### Gamepad

Any connected gamepad can control any player (P1-P4):
- **D-pad**: Move
- **A button**: Place bomb

## Available Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type check
npm run test         # Run tests
```

### Backend

```bash
npm run server:install   # Install server dependencies
npm run server:dev       # Start multiplayer server (development)
npm run server:build     # Build server for production
npm run server:start     # Start production server
npm run multiplayer      # Start frontend + server together
```

### Docker

```bash
npm run server:docker:build   # Build Docker image
npm run server:docker:run     # Run server in Docker
npm run server:docker:stop    # Stop Docker container
```

## Environment Configuration

### Frontend (.env)

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SERVER_URL` | Multiplayer server URL | `http://localhost:3000` |

### Server (server/.env)

```bash
cp server/.env.example server/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Bind address | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |

## Docker Deployment

### Full Stack with Docker Compose

```bash
# Build frontend
npm run build

# Start all services (frontend + server + cloudflare tunnel)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- **Frontend**: http://localhost:8080
- **Server**: http://localhost:3000
- **HTTPS Tunnel**: Check `docker-compose logs cloudflared` for URL

### Server Only

```bash
cd server
docker build -t bomberman-server .
docker run -d -p 3000:3000 bomberman-server
```

### Update Server Image

```bash
docker-compose build --no-cache server
docker-compose up -d server
```

## HTTPS for GitHub Pages

GitHub Pages uses HTTPS, so your server needs HTTPS too. Use the included Cloudflare Tunnel:

```bash
docker-compose up -d
docker-compose logs -f cloudflared
# Look for: https://xyz.trycloudflare.com
```

Set `VITE_SERVER_URL` in GitHub Actions to this URL.

See [HTTPS_SETUP.md](./HTTPS_SETUP.md) for details.

## Multiplayer Architecture

```
[Browser] <--WebSocket--> [NestJS Server] <--broadcast--> [All Players]
                                |
                           [Game Rooms]
                           - Up to 4 players per room
                           - Real-time game state sync
                           - Automatic cleanup on disconnect
```

### Features

- Up to 4 players per room
- Multiple rooms support
- Real-time position and bomb synchronization
- Graceful disconnect handling
- Server shutdown notification

## Contributing

Pull requests are welcome!
