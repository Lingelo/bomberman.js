import { getState, subscribe } from '../state/redux';

export class BackgroundMusicManager {
  private static instance: BackgroundMusicManager;
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  private constructor() {
    // Subscribe to volume changes
    subscribe(() => {
      if (this.audio) {
        this.audio.volume = getState().volume / 100;
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
    if (this.audio && this.isPlaying) {
      return; // Already playing
    }

    if (!this.audio) {
      const module = await import('../assets/songs/ASTEROID_REBELLION.ogg');
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

  static backgroundMusic(): Promise<HTMLAudioElement> {
    return import('../assets/songs/ASTEROID_REBELLION.ogg').then((module) => {
      const audio = new Audio(module.default);
      audio.volume = getState().volume / 100;
      audio.loop = true;
      audio.load();
      return audio;
    });
  }
}
