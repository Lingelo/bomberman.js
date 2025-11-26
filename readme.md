# Bomberman.js

A TypeScript implementation of the classic Bomberman game using HTML5 Canvas and Vite. Features intelligent bot AI with A* pathfinding, retro arcade visuals, and online multiplayer support.

Resources (images and sounds) are sourced from the [Bombermaaan](http://bombermaaan.sourceforge.net/) project.

## Play Online

[Play here](https://lingelo.github.io/bomberman.js/)

## Getting Started

```bash
npm install
npm run dev
```

### Environment Configuration

#### Frontend (.env)

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

- `VITE_SERVER_URL`: Server URL for multiplayer (default: `http://localhost:3000`)
  - For local development: `http://localhost:3000`
  - For network access: `http://<your-ip>:3000`

#### Server (server/.env)

Copy `server/.env.example` to `server/.env` and configure:

```bash
cp server/.env.example server/.env
```

- `PORT`: Server port (default: `3000`)
- `HOST`: Bind address (default: `0.0.0.0` for network access, use `127.0.0.1` for localhost only)
- `NODE_ENV`: Environment mode (`development` or `production`)

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type check
npm run test         # Run tests
```

### Multiplayer Commands

```bash
npm run server:install        # Install server dependencies
npm run server:dev            # Start multiplayer server only
npm run server:build          # Build server for production
npm run server:start          # Start production server
npm run server:docker:build   # Build Docker image for server
npm run server:docker:run     # Run server in Docker
npm run server:docker:stop    # Stop Docker container
npm run multiplayer           # Start both frontend and server
```

### Docker Deployment

Run the entire application with Docker Compose:

```bash
# Build frontend first
npm run build

# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:8080
- Server: http://localhost:3000

Or build and run the server only:

```bash
cd server
npm run docker:build
npm run docker:run
```

### HTTPS Support (for GitHub Pages)

If you deploy to GitHub Pages (which uses HTTPS), you need an HTTPS server URL. The easiest solution is using **Cloudflare Tunnel** included in `docker-compose.yml`:

```bash
# Start server with HTTPS tunnel
docker-compose up -d

# Get your HTTPS URL from the logs
docker-compose logs -f cloudflared
# Look for: https://xyz.trycloudflare.com
```

Then configure the GitHub Actions variable `VITE_SERVER_URL` with your HTTPS URL.

See [HTTPS_SETUP.md](./HTTPS_SETUP.md) for detailed instructions.

## Multiplayer Mode

To play multiplayer:

1. Start both frontend and server:
   ```bash
   npm run multiplayer
   ```

2. Open multiple browser tabs at `http://localhost:5173`

3. Select **MULTIPLAYER** in the menu

4. Click **JOIN LOBBY** on each client

5. When 2+ players are in the lobby, click **START GAME**

### Multiplayer Features

- Up to 4 players online
- Real-time synchronization of movements and bombs
- Automatic lobby management
- Graceful handling of disconnections (refresh = leave game)
- Game ends automatically when only 1 player remains
- Server shutdown notification to all clients

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
- Online multiplayer with NestJS WebSocket server
- Smart bot AI with danger zone prediction
- Multiple keyboard layouts (ZQSD/WASD/Arrows)
- Gamepad support
- Volume control in Options menu

## Contributing

Pull requests are welcome!
