import { Menu } from './menu';
import { getState, subscribe } from '../state/redux';
import type { CanvasContext, KeymapType } from '../types';

export class Options extends Menu {
  volume: number;
  keymap: KeymapType;

  constructor() {
    super();
    this.code = 'OPTIONS';
    this.volume = getState().volume;
    this.keymap = getState().keymap;

    subscribe(() => {
      // Only manage overflow if we're still on this screen
      if (getState().currentScreenCode === 'OPTIONS') {
        this.manageOverflowMenu(1, 3, getState().selectedOption);
      }
      this.volume = getState().volume;
      this.keymap = getState().keymap;
    });
  }

  render(canvasContext: CanvasContext): void {
    super.render(canvasContext);

    canvasContext.ctx.textAlign = 'center';
    canvasContext.ctx.font = '10px "Press Start 2P"';

    // Volume option with glow
    const volumeColor = this.getColorMenu('Volume');
    if (this.selectedOption === 1) {
      canvasContext.ctx.shadowColor = volumeColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = volumeColor;
    canvasContext.ctx.fillText('VOLUME', canvasContext.screenWidth / 2, 200);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 1) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 70, 200);
    }

    // Volume bar
    this.renderVolumeBar(canvasContext, 230);

    // Keymap option with glow
    canvasContext.ctx.font = '10px "Press Start 2P"';
    const keymapColor = this.getColorMenu('Keymap');
    if (this.selectedOption === 2) {
      canvasContext.ctx.shadowColor = keymapColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = keymapColor;
    canvasContext.ctx.fillText('CONTROLS', canvasContext.screenWidth / 2, 300);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 2) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 90, 300);
    }

    // Keymap selector
    this.renderKeymapSelector(canvasContext, 330);

    // Back option with glow
    canvasContext.ctx.font = '10px "Press Start 2P"';
    const backColor = this.getColorMenu('Back');
    if (this.selectedOption === 3) {
      canvasContext.ctx.shadowColor = backColor;
      canvasContext.ctx.shadowBlur = 15;
    }
    canvasContext.ctx.fillStyle = backColor;
    canvasContext.ctx.fillText('BACK', canvasContext.screenWidth / 2, 400);
    canvasContext.ctx.shadowBlur = 0;

    // Selector arrow
    if (this.selectedOption === 3) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 - 50, 400);
    }

    // Controls help
    canvasContext.ctx.font = '6px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#00ff00';
    canvasContext.ctx.fillText('UP/DOWN=NAV  LEFT/RIGHT=CHANGE  ENTER=OK', canvasContext.screenWidth / 2, 540);
  }

  renderKeymapSelector(canvasContext: CanvasContext, y: number): void {
    // Arrows
    if (this.selectedOption === 2) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.font = '10px "Press Start 2P"';
      canvasContext.ctx.fillText('<', canvasContext.screenWidth / 2 - 80, y);
      canvasContext.ctx.fillText('>', canvasContext.screenWidth / 2 + 80, y);
    }

    // Current keymap
    canvasContext.ctx.fillStyle = this.selectedOption === 2 ? '#ff00ff' : '#888888';
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillText(this.keymap, canvasContext.screenWidth / 2, y);
  }

  renderVolumeBar(canvasContext: CanvasContext, y: number): void {
    const barWidth = 200;
    const barHeight = 20;
    const x = (canvasContext.screenWidth - barWidth) / 2;

    // Background bar
    canvasContext.ctx.fillStyle = '#222222';
    canvasContext.ctx.fillRect(x, y, barWidth, barHeight);

    // Filled portion
    const fillWidth = (this.volume / 100) * barWidth;
    const gradient = canvasContext.ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ff0000');
    canvasContext.ctx.fillStyle = gradient;
    canvasContext.ctx.fillRect(x, y, fillWidth, barHeight);

    // Border
    canvasContext.ctx.strokeStyle = this.selectedOption === 1 ? '#00ffff' : '#444444';
    canvasContext.ctx.lineWidth = 2;
    canvasContext.ctx.strokeRect(x, y, barWidth, barHeight);

    // Volume percentage
    canvasContext.ctx.font = '8px "Press Start 2P"';
    canvasContext.ctx.fillStyle = '#ffffff';
    canvasContext.ctx.fillText(`${this.volume}%`, canvasContext.screenWidth / 2, y + 14);

    // Arrows
    if (this.selectedOption === 1) {
      canvasContext.ctx.fillStyle = '#ffff00';
      canvasContext.ctx.font = '10px "Press Start 2P"';
      canvasContext.ctx.fillText('<', x - 20, y + 14);
      canvasContext.ctx.fillText('>', x + barWidth + 20, y + 14);
    }
  }

  getColorMenu(menu: string): string {
    if (menu === 'Volume' && this.selectedOption === 1) {
      return '#00ffff'; // Cyan - selected
    }
    if (menu === 'Keymap' && this.selectedOption === 2) {
      return '#00ffff'; // Cyan - selected
    }
    if (menu === 'Back' && this.selectedOption === 3) {
      return '#ff00ff'; // Magenta - selected
    }
    return '#666666'; // Gray - default
  }
}
