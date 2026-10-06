export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerState {
  id: string;
  title: string;
  totalDuration: number; // in seconds
  remainingTime: number; // in seconds
  status: TimerStatus;
  hideSeconds: boolean;
  themeColor: string; // Tailwind color class name prefix (e.g., 'emerald', 'indigo', 'amber', 'rose', 'slate')
  lastUpdated: number; // timestamp to handle state drift
  selectedMusicId: string;
  musicVolume: number;
  musicPlaying: boolean;
  currentPresetId: string | null;
}

export interface Preset {
  id: string;
  title: string;
  duration: number; // in seconds
  themeColor: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  description: string;
  type: 'synth' | 'url' | 'local';
  genre: string;
  url?: string;
  synthType?: 'ambient' | 'rain' | 'metronome' | 'stream' | 'energetic';
}

export type SyncMessage =
  | { type: 'STATE_CHANGE'; state: TimerState }
  | { type: 'REQUEST_STATE' }
  | { type: 'HEARTBEAT'; state: TimerState };
