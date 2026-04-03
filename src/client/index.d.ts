export {};

type EventsListeners = {
  captions: string;
  ended: void;
  pause: void;
  play: void;
  playbackBlocked: void;
  playing: void;
  offline: void;
  online: void;
  ready: void;
  seek: void;
};

type EventListenerCallback<T extends keyof EventsListeners> =
  EventsListeners[K] extends void ? () => void : (payload: EventsListeners[K]) => void;

type TwitchPlayerOptions  = {
  channel?: string;
  video?: string;
  collection?: string;
  height: number;
  width: number;
  parent?: string[];
  autoplay?: boolean;
  muted?: boolean;
  time?: string;
};

type PlaybackStats = {
  backendVersion: string;
  bufferSize: number;
  codecs: string;
  displayResolution: string;
  fps: number;
  hlsLatencyBroadcaster: number;
  playbackRate: number;
  skippedFrames: number;
  videoResolution: string;
};

class Player {
  static CAPTIONS: 'captions';
  static ENDED: 'ended';
  static PAUSE: 'pause';
  static PLAY: 'play';
  static PLAYBACK_BLOCKED: 'playbackBlocked';
  static PLAYING: 'playing';
  static OFFLINE: 'offline';
  static ONLINE: 'online';
  static READY: 'ready';
  static SEEK: 'seek';

  constructor(id: string, options: TwitchPlayerOptions);

  disableCaptions(): void;
  enableCaptions(): void;
  pause(): void;
  play(): void;
  seek(timestamp:Float): void;
  setChannel(channel: string): void;
  setCollection(collection_id: string, video_id: string): void;
  setQuality(quality: string): void;
  setVideo(video_id: string, timestamp: number): void;

  getMuted(): boolean;
  setMuted(muted: boolean): void;
  getVolume(): number;
  setVolume(volumelevel: number): void;

  getPlaybackStats(): PlaybackStats;
  getChannel(): string;
  getCurrentTime(): number;
  getDuration(): number;
  getEnded(): boolean;
  getQualities(): string[];
  getQuality(): string;
  getVideo(): string;
  isPaused(): boolean;
  addEventListener<K extends keyof EventsListeners>(event: K, callback: EventListenerCallback<K>): void;
}

declare global {
  const Twitch = {
    Player,
  };
}
