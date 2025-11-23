import { Menu } from './menu';
import { GAMESTATUS } from '../game/game-status';
import { ARENAS } from '../game/arenas';
import { COLOR } from '../game/color';
import { getState, subscribe } from '../state/redux';
import type { CanvasContext, KeymapType } from '../types';

export class Title extends Menu {
  ready: boolean;
  selectedArena: number;
  keymap: KeymapType;

  constructor() {
    super();
    this.code = 'TITLE';
    this.ready = false;
    this.selectedArena = 0;
    this.keymap = getState().keymap;

    subscribe(() => {
      this.manageOverflowMenu(1, 3, getState().selectedOption);
      this.ready = getState().gameStatus === GAMESTATUS.READY;
      this.selectedArena = getState().selectedArena;
      this.keymap = getState().keymap;
    });
  }

  render(canvasContext: CanvasContext): void {
    super.render(canvasContext);

    this.renderPlayerSlots(canvasContext);
    this.renderArenaSelector(canvasContext);
    this.renderControls(canvasContext);

    // Menu items - arcade style
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.font = '12px "Press Start 2P"';

    // New Game with glow when selected
    const newGameColor = this.getColorMenu('New Game');
    if (this.selectedOption === 1) {
      canvasContext.ctx.shadowColor = newGameColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = newGameColor;
    canvasContext.ctx.fillText('START GAME', canvasContext.screenWidth / 2, 340);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 1) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 100, 340);
    }

    // Options with glow when selected
    const optionsColor = this.getColorMenu('Options');
    if (this.selectedOption === 2) {
      canvasContext.ctx.shadowColor = optionsColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = optionsColor;
    canvasContext.ctx.fillText('OPTIONS', canvasContext.screenWidth / 2, 380);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 2) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 80, 380);
    }

    // Information with glow when selected
    const infoColor = this.getColorMenu('Information');
    if (this.selectedOption === 3) {
      canvasContext.ctx.shadowColor = infoColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = infoColor;
    canvasContext.ctx.fillText('INFO', canvasContext.screenWidth / 2, 420);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 3) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 60, 420);
    }
  }

  renderPlayerSlots(canvasContext: CanvasContext): void {
    const slotWidth = 100;
    const slotHeight = 50;
    const gap = 15;
    const totalWidth = 4 * slotWidth + 3 * gap;
    const startX = (canvasContext.screenWidth - totalWidth) / 2;
    const y = 160;

    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText('PLAYERS', canvasContext.screenWidth / 2, y - 20);

    const colors = [COLOR.WHITE, COLOR.BLACK, COLOR.RED, COLOR.BLUE];
    const colorNames = ['P1', 'P2', 'P3', 'P4'];
    // Colors matching sprite colors
    const colorStyles = ['#ffffff', '#222222', '#ff0000', '#0088ff'];
    const borderColors = ['#ffffff', '#666666', '#ff0000', '#0088ff'];

    colors.forEach((color, index) => {
      const x = startX + index * (slotWidth + gap);
      const player = this.playersDilayed.find((p) => p.color === color);

      // Dark background
      canvasContext.ctx.fillStyle = '#111111';
      canvasContext.ctx.fillRect(x, y, slotWidth, slotHeight);

      // Border with glow effect for active players
      if (player) {
        canvasContext.ctx.shadowColor = borderColors[index];
        canvasContext.ctx.shadowBlur = 10;
      }
      canvasContext.ctx.strokeStyle = player ? borderColors[index] : '#333333';
      canvasContext.ctx.lineWidth = 2;
      canvasContext.ctx.strokeRect(x, y, slotWidth, slotHeight);
      canvasContext.ctx.shadowBlur = 0;

      if (player) {
        // Player name with color
        canvasContext.ctx.fillStyle = colorStyles[index];
        canvasContext.ctx.font = '8px "Press Start 2P"';
        canvasContext.ctx.fillText(colorNames[index], x + slotWidth / 2, y + 20);

        // Type indicator
        canvasContext.ctx.font = '6px "Press Start 2P"';
        canvasContext.ctx.fillStyle = player.isBot ? '#ff6600' : '#00ff00';
        canvasContext.ctx.fillText(
          player.isBot ? 'CPU' : 'HUMAN',
          x + slotWidth / 2,
          y + 38
        );
      } else {
        // Empty slot
        canvasContext.ctx.fillStyle = '#444444';
        canvasContext.ctx.font = '8px "Press Start 2P"';
        canvasContext.ctx.fillText(colorNames[index], x + slotWidth / 2, y + 20);
        canvasContext.ctx.font = '6px "Press Start 2P"';
        canvasContext.ctx.fillStyle = '#333333';
        canvasContext.ctx.fillText('---', x + slotWidth / 2, y + 38);
      }
    });
  }

  renderArenaSelector(canvasContext: CanvasContext): void {
    const y = 240;

    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText('ARENA', canvasContext.screenWidth / 2, y);

    // Arrow buttons with glow
    canvasContext.ctx.shadowColor = '#ffff00';
    canvasContext.ctx.shadowBlur = 8;
    canvasContext.ctx.fillStyle = '#ffff00';
    canvasContext.ctx.font = '10px "Press Start 2P"';
    canvasContext.ctx.fillText('<', canvasContext.screenWidth / 2 - 80, y + 20);
    canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 + 80, y + 20);
    canvasContext.ctx.shadowBlur = 0;

    // Arena name
    const arenaName = ARENAS[this.selectedArena].name.toUpperCase();
    canvasContext.ctx.fillStyle = '#ff00ff';
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillText(arenaName, canvasContext.screenWidth / 2, y + 20);
  }

  renderControls(canvasContext: CanvasContext): void {
    const y = 550;

    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.fillStyle = '#00ff00';

    canvasContext.ctx.fillText(
      'SPACE=JOIN KB  B=ADD CPU  ARROWS=ARENA',
      canvasContext.screenWidth / 2,
      y
    );

    canvasContext.ctx.fillStyle = '#00ffff';
    canvasContext.ctx.fillText(
      'GAMEPADS AUTO-JOIN (P1-P4)',
      canvasContext.screenWidth / 2,
      y + 12
    );

    canvasContext.ctx.fillStyle = '#666666';
    const keymapText = this.keymap === 'ARROWS' ? 'ARROWS' : this.keymap;
    canvasContext.ctx.fillText(
      `KB: ${keymapText}+SPACE  GAMEPAD: DPAD+A`,
      canvasContext.screenWidth / 2,
      y + 24
    );
  }

  getColorMenu(menu: string): string {
    if (menu === 'New Game' && this.selectedOption === 1 && this.ready) {
      return '#00ff00'; // Green - selected and ready
    }
    if (menu === 'New Game' && this.selectedOption === 1 && !this.ready) {
      return '#ff0066'; // Pink/red - selected but not ready
    }
    if (menu === 'New Game' && !this.ready) {
      return '#333333'; // Dark gray - not ready
    }
    if (menu === 'Options' && this.selectedOption === 2) {
      return '#00ffff'; // Cyan - selected
    }
    if (menu === 'Information' && this.selectedOption === 3) {
      return '#ffff00'; // Yellow - selected
    }
    return '#888888'; // Gray - default
  }
}
