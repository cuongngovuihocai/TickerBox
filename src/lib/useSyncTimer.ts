import { useEffect, useState, useRef } from 'react';
import { TimerState, TimerStatus, Preset, SyncMessage } from '../types';
import { synthEngine } from './synthAudio';

// Static Presets available for quick selection
export const PRESETS: Preset[] = [
  { id: 'intro', title: 'Giới thiệu & Khởi động', duration: 180, themeColor: 'emerald' }, // 3 mins
  { id: 'present', title: 'Trình bày Nội dung', duration: 600, themeColor: 'indigo' },    // 10 mins
  { id: 'qa', title: 'Thảo luận & Hỏi đáp', duration: 300, themeColor: 'amber' },        // 5 mins
  { id: 'pitch', title: 'Pitching / Thuyết trình nhanh', duration: 120, themeColor: 'rose' }, // 2 mins
  { id: 'break', title: 'Giải lao / Thư giãn', duration: 900, themeColor: 'slate' },      // 15 mins
  { id: 'deep', title: 'Thảo luận chuyên sâu', duration: 1800, themeColor: 'indigo' },    // 30 mins
];

const DEFAULT_STATE: TimerState = {
  id: 'default',
  title: 'Thuyết trình',
  totalDuration: 600,
  remainingTime: 600,
  status: 'idle',
  hideSeconds: false,
  themeColor: 'emerald',
  lastUpdated: Date.now(),
  selectedMusicId: 'none',
  musicVolume: 0.5,
  musicPlaying: false,
  currentPresetId: 'present',
};

export function useSyncTimer(role: 'controller' | 'projector' | 'any' = 'any') {
  const [state, setState] = useState<TimerState>(() => {
    // Try reading initial state from localStorage
    const saved = localStorage.getItem('presentation_timer_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TimerState;
        // If it was running, we calculate the elapsed time based on the active endTime
        const endTime = localStorage.getItem('presentation_timer_endtime');
        if (parsed.status === 'running' && endTime) {
          const endTs = parseInt(endTime, 10);
          const remaining = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
          return {
            ...parsed,
            remainingTime: remaining,
            status: remaining > 0 ? 'running' : 'completed',
          };
        }
        return parsed;
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const bcRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<TimerState>(state);
  stateRef.current = state;

  // Sync music engine with our react state
  useEffect(() => {
    if (state.musicPlaying && state.selectedMusicId !== 'none' && state.status === 'running') {
      synthEngine.start(state.selectedMusicId as any);
      synthEngine.setVolume(state.musicVolume);
    } else {
      synthEngine.stop();
    }
  }, [state.musicPlaying, state.selectedMusicId, state.status, state.musicVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      synthEngine.stop();
    };
  }, []);

  // Set up synchronization channels (BroadcastChannel & localStorage listener)
  useEffect(() => {
    // Initialize BroadcastChannel
    const bc = new BroadcastChannel('presentation-timer-sync');
    bcRef.current = bc;

    // Handler for incoming synchronization states
    const handleIncomingState = (incoming: TimerState) => {
      // Compare timestamp to avoid stale overrides
      if (incoming.lastUpdated > stateRef.current.lastUpdated || incoming.status !== stateRef.current.status || incoming.remainingTime !== stateRef.current.remainingTime) {
        // Compute correct remainingTime if running
        let updatedState = { ...incoming };
        if (incoming.status === 'running') {
          const endTimeStr = localStorage.getItem('presentation_timer_endtime');
          if (endTimeStr) {
            const endTs = parseInt(endTimeStr, 10);
            const remaining = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
            updatedState.remainingTime = remaining;
            if (remaining <= 0) {
              updatedState.status = 'completed';
            }
          }
        }
        setState(updatedState);
      }
    };

    bc.onmessage = (event) => {
      const msg = event.data as SyncMessage;
      if (msg.type === 'STATE_CHANGE' || msg.type === 'HEARTBEAT') {
        handleIncomingState(msg.state);
      } else if (msg.type === 'REQUEST_STATE' && role === 'controller') {
        // Respond with current state
        bc.postMessage({ type: 'STATE_CHANGE', state: stateRef.current });
      }
    };

    // Listen to localStorage changes as a fallback
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'presentation_timer_state' && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue) as TimerState;
          handleIncomingState(incoming);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // If we are a newly opened projector/secondary screen, request state from any active controller
    if (role === 'projector') {
      bc.postMessage({ type: 'REQUEST_STATE' });
    }

    return () => {
      bc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [role]);

  // Main high-precision countdown loop
  useEffect(() => {
    if (state.status !== 'running') return;

    const timer = setInterval(() => {
      const endTimeStr = localStorage.getItem('presentation_timer_endtime');
      if (!endTimeStr) return;

      const endTime = parseInt(endTimeStr, 10);
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        clearInterval(timer);
        updateState({
          remainingTime: 0,
          status: 'completed',
          musicPlaying: false, // Turn off music on completion
        });
        
        // Play final chime sound
        triggerBellRing();
      } else {
        // Just update local remaining time
        setState((prev) => {
          if (prev.remainingTime === remaining) return prev;
          return { ...prev, remainingTime: remaining };
        });
      }
    }, 100); // Check 10 times a second for snappy frame-perfect clock alignment

    return () => clearInterval(timer);
  }, [state.status]);

  // Simple Web Audio alert bell when time completes
  const triggerBellRing = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      // Beautiful triple chime
      const scheduleChime = (delay: number, pitch: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now + delay);
        
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + delay + 1.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 1.3);
      };

      scheduleChime(0, 523.25);   // C5
      scheduleChime(0.25, 659.25); // E5
      scheduleChime(0.5, 783.99);  // G5
    } catch (e) {}
  };

  // Broadcast and save state changes
  const updateState = (partial: Partial<TimerState>) => {
    setState((prev) => {
      const updated = {
        ...prev,
        ...partial,
        lastUpdated: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem('presentation_timer_state', JSON.stringify(updated));

      // Broadcast changes to secondary tabs
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'STATE_CHANGE',
          state: updated,
        });
      }

      return updated;
    });
  };

  // ACTIONS

  const startTimer = () => {
    if (state.status === 'running') return;

    // Save end time timestamp to localStorage so all tabs sync on the same clock
    const endTime = Date.now() + state.remainingTime * 1000;
    localStorage.setItem('presentation_timer_endtime', endTime.toString());

    updateState({
      status: 'running',
    });
  };

  const pauseTimer = () => {
    if (state.status !== 'running') return;
    localStorage.removeItem('presentation_timer_endtime');
    updateState({
      status: 'paused',
    });
  };

  const resetTimer = () => {
    localStorage.removeItem('presentation_timer_endtime');
    updateState({
      remainingTime: state.totalDuration,
      status: 'idle',
    });
  };

  const setDuration = (seconds: number) => {
    localStorage.removeItem('presentation_timer_endtime');
    updateState({
      totalDuration: seconds,
      remainingTime: seconds,
      status: 'idle',
    });
  };

  const selectPreset = (preset: Preset) => {
    localStorage.removeItem('presentation_timer_endtime');
    updateState({
      currentPresetId: preset.id,
      title: preset.title,
      totalDuration: preset.duration,
      remainingTime: preset.duration,
      themeColor: preset.themeColor,
      status: 'idle',
    });
  };

  const toggleHideSeconds = () => {
    updateState({
      hideSeconds: !state.hideSeconds,
    });
  };

  const setThemeColor = (color: string) => {
    updateState({
      themeColor: color,
    });
  };

  const setTimerTitle = (title: string) => {
    updateState({
      title,
    });
  };

  const selectMusic = (musicId: string) => {
    updateState({
      selectedMusicId: musicId,
    });
  };

  const toggleMusicPlay = () => {
    updateState({
      musicPlaying: !state.musicPlaying,
    });
  };

  const setMusicVolume = (vol: number) => {
    updateState({
      musicVolume: vol,
    });
  };

  return {
    state,
    startTimer,
    pauseTimer,
    resetTimer,
    setDuration,
    selectPreset,
    toggleHideSeconds,
    setThemeColor,
    setTimerTitle,
    selectMusic,
    toggleMusicPlay,
    setMusicVolume,
    updateState, // generic updater
  };
}
