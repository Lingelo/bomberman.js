import { getState, subscribe } from '../state/redux';

export class BackgroundMusicManager {
  private static instance: BackgroundMusicManager;
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  private constructor() {
    // Subscribe to volume and musicEnabled changes
    subscribe(() => {
      if (this.audio) {
        this.audio.volume = getState().volume / 100;
      }
      // Stop music if disabled
      if (!getState().musicEnabled && this.isPlaying) {
        this.stop();
      }
      // Start music if enabled and we're on a menu screen
      if (getState().musicEnabled && !this.isPlaying) {
        const menuScreens = ['TITLE', 'OPTIONS', 'INFORMATION', 'CREDITS', 'LOBBY'];
        if (menuScreens.includes(getState().currentScreenCode)) {
          this.start();
        }
      }
    });
  }

  static getInstance(): BackgroundMusicManager {
    if (!BackgroundMusicManager.instance) {
      BackgroundMusicManager.instance = new BackgroundMusicManager();
    }
    return BackgroundMusicManager.instance;
  }

  async start(): Promise<void> {
    // Don't start if music is disabled
    if (!getState().musicEnabled) {
      return;
    }

    if (this.audio && this.isPlaying) {
      return; // Already playing
    }

    if (!this.audio) {
      const module = await import('../assets/songs/POWERUP.ogg');
      this.audio = new Audio(module.default);
      this.audio.volume = getState().volume / 100;
      this.audio.loop = true;
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (error) {
      console.warn('Background music autoplay blocked:', error);
    }
  }

  stop(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export class Music {
  private static createAudio(module: { default: string }): HTMLAudioElement {
    const audio = new Audio(module.default);
    audio.volume = getState().volume / 100;
    audio.load();
    return audio;
  }

  static menuNext(): Promise<HTMLAudioElement> {
    return import('../assets/songs/MENU_NEXT.ogg').then(this.createAudio);
  }

  static menuPrevious(): Promise<HTMLAudioElement> {
    return import('../assets/songs/MENU_PREVIOUS.ogg').then(this.createAudio);
  }

  static menuBeep(): Promise<HTMLAudioElement> {
    return import('../assets/songs/MENU_BEEP.ogg').then(this.createAudio);
  }

  static bombDrop(): Promise<HTMLAudioElement> {
    return import('../assets/songs/BOMB_DROP.ogg').then(this.createAudio);
  }

  static death(): Promise<HTMLAudioElement> {
    return import('../assets/songs/BOMBER_DEATH.ogg').then(this.createAudio);
  }

  static explosion(): Promise<HTMLAudioElement> {
    return import('../assets/songs/EXPLOSION_02_2.ogg').then(this.createAudio);
  }

  static bonus(): Promise<HTMLAudioElement> {
    return import('../assets/songs/BREAK_1.ogg').then(this.createAudio);
  }

  static win(): Promise<HTMLAudioElement> {
    return import('../assets/songs/VICTORY.ogg').then(this.createAudio);
  }
}
