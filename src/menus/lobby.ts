import { Menu } from './menu';
import { dispatch, getState, subscribe } from '../state/redux';
import { Action } from '../state/actions';
import { networkClient, type LobbyState, type NetworkPlayer, type RoomInfo } from '../utils/network';
import type { CanvasContext } from '../types';

type LobbyView = 'ROOM_LIST' | 'IN_ROOM';

export class Lobby extends Menu {
  private lobbyState: LobbyState | null = null;
  private roomList: RoomInfo[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'error' | 'disconnected' = 'connecting';
  private errorMessage: string = '';
  private playerName: string = 'Player';
  private hasJoined: boolean = false;
  private lastSelectedOption: number = 1;
  private currentView: LobbyView = 'ROOM_LIST';
  private selectedRoomIndex: number = 0;

  constructor() {
    super();
    this.code = 'LOBBY';
    this.selectedOption = 1;
    this.lastSelectedOption = 1;

    subscribe(() => {
      const state = getState();
      if (state.currentScreenCode === 'LOBBY') {
        const newOption = state.selectedOption;

        if (newOption !== this.lastSelectedOption) {
          if (newOption > this.lastSelectedOption) {
            if (this.currentView === 'ROOM_LIST') {
              this.selectedRoomIndex = Math.min(this.roomList.length, this.selectedRoomIndex + 1);
            } else {
              this.selectedOption = Math.min(2, this.selectedOption + 1);
            }
          } else {
            if (this.currentView === 'ROOM_LIST') {
              this.selectedRoomIndex = Math.max(0, this.selectedRoomIndex - 1);
            } else {
              this.selectedOption = Math.max(1, this.selectedOption - 1);
            }
          }
          this.lastSelectedOption = newOption;
        }
      }
    });

    this.bindKeyboardEvents();
    this.setupNetworkHandlers();
    this.connect();
  }

  private bindKeyboardEvents(): void {
    const handleKeydown = (e: KeyboardEvent) => {
      if (getState().currentScreenCode !== 'LOBBY') return;

      if (e.keyCode === 13) {
        e.preventDefault();
        this.handleEnter();
      } else if (e.keyCode === 27) {
        e.preventDefault();
        this.handleEscape();
      }
    };

    addEventListener('keydown', handleKeydown);
  }

  private setupNetworkHandlers(): void {
    networkClient.on('connected', () => {
      this.connectionStatus = 'connected';
      networkClient.getRoomList();
    });

    networkClient.on('disconnected', () => {
      this.connectionStatus = 'disconnected';
      this.hasJoined = false;
      this.currentView = 'ROOM_LIST';
    });

    networkClient.on('connection-error', (data: unknown) => {
      const errorData = data as { error: string };
      this.connectionStatus = 'error';
      this.errorMessage = errorData.error || 'Connection failed';
    });

    networkClient.on('room-list', (rooms: unknown) => {
      this.roomList = rooms as RoomInfo[];
    });

    networkClient.on('room-update', (data: unknown) => {
      const updateData = data as { players: NetworkPlayer[]; status: string };
      this.lobbyState = {
        status: updateData.status as 'WAITING' | 'IN_PROGRESS',
        players: updateData.players,
        maxPlayers: 4,
      };
    });

    networkClient.on('join-success', () => {
      this.hasJoined = true;
      this.currentView = 'IN_ROOM';
      this.selectedOption = 1;
    });

    networkClient.on('join-error', (data: unknown) => {
      const errorData = data as { message: string };
      this.errorMessage = errorData.message;
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    });

    networkClient.on('game-started', () => {
      dispatch({
        type: 'SET_SCREEN',
        payload: { screen: 'MULTIPLAYER_GAME' },
      });
    });

    networkClient.on('server-shutdown', () => {
      this.connectionStatus = 'disconnected';
      this.errorMessage = 'Server shut down';
      this.hasJoined = false;
      this.currentView = 'ROOM_LIST';
    });

    networkClient.on('game-ended', (data: unknown) => {
      const endData = data as { reason: string };
      this.errorMessage = endData.reason;
      this.currentView = 'IN_ROOM';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    });
  }

  private async connect(): Promise<void> {
    try {
      await networkClient.connect();
    } catch {
      this.connectionStatus = 'error';
      this.errorMessage = 'Could not connect to server';
    }
  }

  update(canvasContext: CanvasContext): void {
    this.render(canvasContext);
  }

  render(canvasContext: CanvasContext): void {
    // Ensure canvas is at proper size for menus
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (canvas.width !== 960 || canvas.height !== 640) {
      canvas.width = 960;
      canvas.height = 640;
      canvasContext.screenWidth = 960;
      canvasContext.screenHeight = 640;
    }

    super.render(canvasContext);

    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.font = '16px "Press Start 2P"';

    canvasContext.ctx.shadowColor = '#00ff00';
    canvasContext.ctx.shadowBlur = 15;
    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('MULTIPLAYER', canvasContext.screenWidth / 2, 130);
    canvasContext.ctx.shadowBlur = 0;

    if (this.connectionStatus === 'connecting') {
      this.renderConnecting(canvasContext);
    } else if (this.connectionStatus === 'error' || this.connectionStatus === 'disconnected') {
      this.renderError(canvasContext);
    } else if (this.connectionStatus === 'connected') {
      if (this.currentView === 'ROOM_LIST') {
        this.renderRoomList(canvasContext);
      } else {
        this.renderRoom(canvasContext);
      }
    }

    this.renderControls(canvasContext);
  }

  private renderConnecting(canvasContext: CanvasContext): void {
    const flash = Math.floor(Date.now() / 500) % 2 === 0;
    canvasContext.ctx.font = '10px "Press Start 2P"';
    canvasContext.ctx.fillStyle = flash ? '#ffff00' : '#888800';
    canvasContext.ctx.fillText('CONNECTING TO SERVER...', canvasContext.screenWidth / 2, 200);
  }

  private renderError(canvasContext: CanvasContext): void {
    canvasContext.ctx.font = '10px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff0066';
    canvasContext.ctx.fillText('CONNECTION ERROR', canvasContext.screenWidth / 2, 200);

    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ff6666';
    canvasContext.ctx.fillText(this.errorMessage, canvasContext.screenWidth / 2, 230);

    canvasContext.ctx.fillStyle = '#888888';
    canvasContext.ctx.fillText('Press ESCAPE to return', canvasContext.screenWidth / 2, 280);
  }

  private renderRoomList(canvasContext: CanvasContext): void {
    canvasContext.ctx.font = '10px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText('SELECT A ROOM', canvasContext.screenWidth / 2, 180);

    const startY = 220;
    const roomHeight = 50;

    this.roomList.forEach((room, index) => {
      const y = startY + index * roomHeight;
      const isSelected = index === this.selectedRoomIndex;

      canvasContext.ctx.fillStyle = '#111111';
      canvasContext.ctx.fillRect(canvasContext.screenWidth / 2 - 150, y, 300, 40);

      if (isSelected) {
        canvasContext.ctx.shadowColor = '#00ff00';
        canvasContext.ctx.shadowBlur = 10;
      }
      canvasContext.ctx.strokeStyle = isSelected ? '#00ff00' : '#333333';
      canvasContext.ctx.lineWidth = 2;
      canvasContext.ctx.strokeRect(canvasContext.screenWidth / 2 - 150, y, 300, 40);
      canvasContext.ctx.shadowBlur = 0;

      canvasContext.ctx.font = '8px "Press Start 2P"';
      canvasContext.ctx.fillStyle = isSelected ? '#00ff00' : '#888888';
      canvasContext.ctx.textAlign = 'left';
      canvasContext.ctx.fillText(room.name, canvasContext.screenWidth / 2 - 140, y + 18);

      canvasContext.ctx.textAlign = 'right';
      const statusColor = room.status === 'IN_PROGRESS' ? '#ff6600' : '#00ff00';
      canvasContext.ctx.fillStyle = statusColor;
      canvasContext.ctx.fillText(
        `${room.playerCount}/${room.maxPlayers}`,
        canvasContext.screenWidth / 2 + 140,
        y + 18
      );

      if (room.status === 'IN_PROGRESS') {
        canvasContext.ctx.font = '6px "Press Start 2P"';
        canvasContext.ctx.fillStyle = '#ff6600';
        canvasContext.ctx.fillText('IN GAME', canvasContext.screenWidth / 2 + 140, y + 32);
      }

      canvasContext.ctx.textAlign = 'center';
    });

    const backY = startY + this.roomList.length * roomHeight + 20;
    const isBackSelected = this.selectedRoomIndex === this.roomList.length;

    canvasContext.ctx.font = '10px "Press Start 2P"';
    if (isBackSelected) {
      canvasContext.ctx.shadowColor = '#ff0066';
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = isBackSelected ? '#ff0066' : '#888888';
    canvasContext.ctx.fillText('BACK', canvasContext.screenWidth / 2, backY);
    canvasContext.ctx.shadowBlur = 0;

    if (isBackSelected) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 60, backY);
    }

    if (this.errorMessage) {
      canvasContext.ctx.font = '6px "Press Start 2P"';
      canvasContext.ctx.fillStyle = '#ff6666';
      canvasContext.ctx.fillText(this.errorMessage, canvasContext.screenWidth / 2, backY + 40);
    }
  }

  private renderRoom(canvasContext: CanvasContext): void {
    this.renderPlayerList(canvasContext);
    this.renderRoomMenuOptions(canvasContext);
  }

  private renderPlayerList(canvasContext: CanvasContext): void {
    const y = 200;
    const slotWidth = 100;
    const slotHeight = 50;
    const gap = 15;
    const totalWidth = 4 * slotWidth + 3 * gap;
    const startX = (canvasContext.screenWidth - totalWidth) / 2;

    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText('ROOM PLAYERS', canvasContext.screenWidth / 2, y - 20);

    const colorNames = ['P1', 'P2', 'P3', 'P4'];
    const colorStyles = ['#ffffff', '#222222', '#ff0000', '#0088ff'];
    const borderColors = ['#ffffff', '#666666', '#ff0000', '#0088ff'];

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (slotWidth + gap);
      const player = this.lobbyState?.players.find((p: NetworkPlayer) => p.color === i);

      canvasContext.ctx.fillStyle = '#111111';
      canvasContext.ctx.fillRect(x, y, slotWidth, slotHeight);

      if (player) {
        canvasContext.ctx.shadowColor = borderColors[i];
        canvasContext.ctx.shadowBlur = 10;
      }
      canvasContext.ctx.strokeStyle = player ? borderColors[i] : '#333333';
      canvasContext.ctx.lineWidth = 2;
      canvasContext.ctx.strokeRect(x, y, slotWidth, slotHeight);
      canvasContext.ctx.shadowBlur = 0;

      if (player) {
        canvasContext.ctx.fillStyle = colorStyles[i];
        canvasContext.ctx.font = '8px "Press Start 2P"';
        canvasContext.ctx.fillText(colorNames[i], x + slotWidth / 2, y + 20);

        canvasContext.ctx.font = '5px "Press Start 2P"';
        canvasContext.ctx.fillStyle = '#00ff00';
        const displayName = player.name.length > 8 ? player.name.substring(0, 8) : player.name;
        canvasContext.ctx.fillText(displayName, x + slotWidth / 2, y + 38);
      } else {
        canvasContext.ctx.fillStyle = '#444444';
        canvasContext.ctx.font = '8px "Press Start 2P"';
        canvasContext.ctx.fillText(colorNames[i], x + slotWidth / 2, y + 20);
        canvasContext.ctx.font = '6px "Press Start 2P"';
        canvasContext.ctx.fillStyle = '#333333';
        canvasContext.ctx.fillText('---', x + slotWidth / 2, y + 38);
      }
    }

    const playerCount = this.lobbyState?.players.length || 0;
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = playerCount >= 2 ? '#00ff00' : '#ff0066';
    canvasContext.ctx.fillText(
      `${playerCount}/4 PLAYERS`,
      canvasContext.screenWidth / 2,
      y + slotHeight + 20
    );
  }

  private renderRoomMenuOptions(canvasContext: CanvasContext): void {
    const y = 360;
    canvasContext.ctx.font = '10px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';

    const canStart = (this.lobbyState?.players.length || 0) >= 2;

    const startColor = canStart ? (this.selectedOption === 1 ? '#00ff00' : '#888888') : '#333333';
    if (this.selectedOption === 1 && canStart) {
      canvasContext.ctx.shadowColor = '#00ff00';
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = startColor;
    canvasContext.ctx.fillText('START GAME', canvasContext.screenWidth / 2, y);
    canvasContext.ctx.shadowBlur = 0;

    if (this.selectedOption === 1 && canStart) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 100, y);
    }

    const backColor = this.selectedOption === 2 ? '#ff0066' : '#888888';
    if (this.selectedOption === 2) {
      canvasContext.ctx.shadowColor = '#ff0066';
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = backColor;
    canvasContext.ctx.fillText('LEAVE ROOM', canvasContext.screenWidth / 2, y + 40);
    canvasContext.ctx.shadowBlur = 0;

    if (this.selectedOption === 2) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 100, y + 40);
    }

    if (this.errorMessage) {
      canvasContext.ctx.font = '6px "Press Start 2P"';
      canvasContext.ctx.fillStyle = '#ff6666';
      canvasContext.ctx.fillText(this.errorMessage, canvasContext.screenWidth / 2, y + 80);
    }
  }

  private renderControls(canvasContext: CanvasContext): void {
    const y = 550;

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.fillStyle = '#666666';
    canvasContext.ctx.fillText(
      'ARROWS=NAVIGATE  ENTER=SELECT  ESC=BACK',
      canvasContext.screenWidth / 2,
      y
    );
  }

  private handleEnter(): void {
    if (this.currentView === 'ROOM_LIST') {
      if (this.selectedRoomIndex < this.roomList.length) {
        const room = this.roomList[this.selectedRoomIndex];
        if (room.status !== 'IN_PROGRESS') {
          networkClient.joinRoom(room.id, this.playerName);
        }
      } else {
        this.leave();
      }
    } else {
      if (this.selectedOption === 1) {
        const canStart = (this.lobbyState?.players.length || 0) >= 2;
        if (canStart) {
          networkClient.startGame();
        }
      } else if (this.selectedOption === 2) {
        networkClient.leaveRoom();
        this.hasJoined = false;
        this.currentView = 'ROOM_LIST';
        this.selectedRoomIndex = 0;
      }
    }
  }

  private handleEscape(): void {
    if (this.currentView === 'IN_ROOM') {
      networkClient.leaveRoom();
      this.hasJoined = false;
      this.currentView = 'ROOM_LIST';
      this.selectedRoomIndex = 0;
    } else {
      this.leave();
    }
  }

  private leave(): void {
    if (this.hasJoined) {
      networkClient.leaveRoom();
    }
    networkClient.disconnect();
    dispatch({ type: Action.ESCAPE });
  }

  setPlayerName(name: string): void {
    this.playerName = name;
  }
}
