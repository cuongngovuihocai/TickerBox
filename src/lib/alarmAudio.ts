/**
 * High-definition Web Audio Synthesizer for Presentation Timer Alarms & Chimes.
 * Extended musical sequences (2x - 3x length) designed to politely and clearly
 * attract attention in meeting rooms and noisy discussions.
 */

export interface AlarmSoundOption {
  id: string;
  name: string;
  icon: string;
}

export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
  {
    id: 'airport',
    name: 'Chuông thông báo sân bay',
    icon: '✈️',
  },
  {
    id: 'classic',
    name: 'Chuông ba âm kinh điển',
    icon: '🔔',
  },
  {
    id: 'digital',
    name: 'Còi điện tử dồn dập',
    icon: '🚨',
  },
  {
    id: 'westminster',
    name: 'Chuông tháp Westminster (Big Ben)',
    icon: '🏛️',
  },
  {
    id: 'dingdong',
    name: 'Chuông sảnh Ding-Dong',
    icon: '🛎️',
  },
  {
    id: 'fanfare',
    name: 'Khúc ca hoàn thành',
    icon: '🎺',
  },
  {
    id: 'gong',
    name: 'Cồng chiêng trầm uy nghiêm',
    icon: '🪘',
  },
  {
    id: 'marimba',
    name: 'Gõ mộc Marimba vui tươi',
    icon: '🪵',
  },
];

class AlarmEngine {
  private ctx: AudioContext | null = null;
  private stopFns: (() => void)[] = [];
  private activeTimeouts: number[] = [];

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public stop() {
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts = [];

    this.stopFns.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore cleanup errors
      }
    });
    this.stopFns = [];
  }

  public play(soundId: string = 'airport', volume: number = 1.0) {
    this.stop();

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Dynamics Compressor for maximum clarity and presence without clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, now);
      compressor.knee.setValueAtTime(24, now);
      compressor.ratio.setValueAtTime(10, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.2, now);
      compressor.connect(ctx.destination);

      // Master gain node
      const masterGain = ctx.createGain();
      const safeVol = Math.max(0.1, Math.min(2.0, volume));
      masterGain.gain.setValueAtTime(safeVol, now);
      masterGain.connect(compressor);

      this.stopFns.push(() => {
        try {
          masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
          setTimeout(() => {
            masterGain.disconnect();
            compressor.disconnect();
          }, 80);
        } catch {
          // Ignore
        }
      });

      switch (soundId) {
        case 'airport':
          this.playAirport(ctx, masterGain, now);
          break;
        case 'digital':
          this.playDigitalPulse(ctx, masterGain, now);
          break;
        case 'westminster':
          this.playWestminster(ctx, masterGain, now);
          break;
        case 'dingdong':
          this.playDingDong(ctx, masterGain, now);
          break;
        case 'fanfare':
          this.playVictoryFanfare(ctx, masterGain, now);
          break;
        case 'gong':
          this.playZenGong(ctx, masterGain, now);
          break;
        case 'marimba':
          this.playMarimba(ctx, masterGain, now);
          break;
        case 'classic':
        default:
          this.playClassicChime(ctx, masterGain, now);
          break;
      }
    } catch (err) {
      console.warn('Alarm playback error:', err);
    }
  }

  /**
   * Helper: Harmonic bell chime with fundamental + overtone harmonics
   */
  private scheduleBell(
    ctx: AudioContext,
    target: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number = 0.5
  ) {
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(gainLevel * 0.72, startTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

    osc1.connect(gain1);
    gain1.connect(target);
    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.1);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(gainLevel * 0.25, startTime + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.00001, startTime + duration * 0.65);

    osc2.connect(gain2);
    gain2.connect(target);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.1);

    this.stopFns.push(() => {
      try {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
      } catch {
        // Ignore
      }
    });
  }

  /**
   * 1. Airport Announcement Chime (Chuông thông báo sân bay)
   * The iconic international terminal pre-announcement motif
   */
  private playAirport(ctx: AudioContext, master: AudioNode, now: number) {
    // Motif 1 (Ascending clear acoustic chime)
    this.scheduleBell(ctx, master, 349.23, now + 0.0, 1.3, 0.75); // F4
    this.scheduleBell(ctx, master, 440.00, now + 0.35, 1.3, 0.8);  // A4
    this.scheduleBell(ctx, master, 523.25, now + 0.70, 1.4, 0.85); // C5
    this.scheduleBell(ctx, master, 698.46, now + 1.05, 1.8, 0.95); // F5

    // Short graceful breath (1.1s), then Motif 2 (Affirmative resolution sequence)
    this.scheduleBell(ctx, master, 523.25, now + 2.10, 1.3, 0.75); // C5
    this.scheduleBell(ctx, master, 698.46, now + 2.45, 1.4, 0.85); // F5
    this.scheduleBell(ctx, master, 880.00, now + 2.80, 1.5, 0.9);  // A5
    this.scheduleBell(ctx, master, 1046.50, now + 3.15, 2.2, 1.0); // C6 (long resonant crystal chime)
  }

  /**
   * 2. Classic Chime (Extended 2-part sequence)
   */
  private playClassicChime(ctx: AudioContext, master: AudioNode, now: number) {
    // Part 1: Ascending C-E-G-C
    this.scheduleBell(ctx, master, 523.25, now + 0.0, 1.2, 0.7);   // C5
    this.scheduleBell(ctx, master, 659.25, now + 0.28, 1.2, 0.75); // E5
    this.scheduleBell(ctx, master, 783.99, now + 0.56, 1.3, 0.8);  // G5
    this.scheduleBell(ctx, master, 1046.50, now + 0.88, 1.6, 0.85); // C6

    // Part 2: Descending melodious phrase
    this.scheduleBell(ctx, master, 783.99, now + 1.70, 1.1, 0.7);  // G5
    this.scheduleBell(ctx, master, 659.25, now + 1.98, 1.1, 0.75); // E5
    this.scheduleBell(ctx, master, 587.33, now + 2.26, 1.2, 0.8);  // D5
    this.scheduleBell(ctx, master, 523.25, now + 2.58, 1.4, 0.85); // C5

    // Part 3: Resonant C-Major chord resolution
    this.scheduleBell(ctx, master, 523.25, now + 3.10, 2.0, 0.6); // C5
    this.scheduleBell(ctx, master, 783.99, now + 3.10, 2.0, 0.6); // G5
    this.scheduleBell(ctx, master, 1046.50, now + 3.10, 2.2, 0.9); // C6
  }

  /**
   * 3. Digital Pulse (Extended double-beep alert)
   */
  private playDigitalPulse(ctx: AudioContext, master: AudioNode, now: number) {
    const scheduleBeep = (freq: number, start: number, dur: number, gainLvl: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, start);
      filter.Q.setValueAtTime(4.0, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(gainLvl, start + 0.008);
      gain.gain.setValueAtTime(gainLvl, start + dur - 0.015);
      gain.gain.linearRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(start);
      osc.stop(start + dur + 0.02);

      this.stopFns.push(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      });
    };

    const playBurst = (burstStart: number) => {
      scheduleBeep(1300, burstStart, 0.08, 0.85);
      scheduleBeep(1750, burstStart + 0.11, 0.13, 0.95);
    };

    // 6 progressive double-beep bursts across 3.2 seconds
    playBurst(now + 0.0);
    playBurst(now + 0.45);
    playBurst(now + 0.90);
    playBurst(now + 1.50);
    playBurst(now + 1.95);
    playBurst(now + 2.45);
  }

  /**
   * 4. Westminster Quarters (Full 8-note clock tower sequence)
   */
  private playWestminster(ctx: AudioContext, master: AudioNode, now: number) {
    // First 4 notes
    this.scheduleBell(ctx, master, 415.30, now + 0.0, 1.4, 0.8);  // G#4
    this.scheduleBell(ctx, master, 369.99, now + 0.48, 1.4, 0.8); // F#4
    this.scheduleBell(ctx, master, 329.63, now + 0.96, 1.4, 0.85); // E4
    this.scheduleBell(ctx, master, 246.94, now + 1.44, 1.8, 0.95); // B3

    // Second 4 notes
    this.scheduleBell(ctx, master, 329.63, now + 2.30, 1.4, 0.8);  // E4
    this.scheduleBell(ctx, master, 415.30, now + 2.78, 1.4, 0.85); // G#4
    this.scheduleBell(ctx, master, 369.99, now + 3.26, 1.5, 0.9);  // F#4
    this.scheduleBell(ctx, master, 246.94, now + 3.74, 2.4, 1.0);  // B3 (deep reverberating conclusion)
  }

  /**
   * 5. Ding-Dong (Double Ding-Dong sequence)
   */
  private playDingDong(ctx: AudioContext, master: AudioNode, now: number) {
    // First Ding-Dong
    this.scheduleBell(ctx, master, 783.99, now + 0.0, 1.2, 0.85);  // G5
    this.scheduleBell(ctx, master, 659.25, now + 0.45, 1.6, 0.95);  // E5

    // Second Ding-Dong with harmonic flourish
    this.scheduleBell(ctx, master, 880.00, now + 1.70, 1.2, 0.85);  // A5
    this.scheduleBell(ctx, master, 739.99, now + 2.15, 1.4, 0.9);   // F#5
    this.scheduleBell(ctx, master, 587.33, now + 2.60, 2.2, 0.95);  // D5
  }

  /**
   * 6. Victory Fanfare (Extended celebratory sequence)
   */
  private playVictoryFanfare(ctx: AudioContext, master: AudioNode, now: number) {
    // Fanfare run 1
    this.scheduleBell(ctx, master, 392.00, now + 0.0, 0.35, 0.7);  // G4
    this.scheduleBell(ctx, master, 523.25, now + 0.16, 0.35, 0.75); // C5
    this.scheduleBell(ctx, master, 659.25, now + 0.32, 0.35, 0.8);  // E5
    this.scheduleBell(ctx, master, 783.99, now + 0.48, 0.5, 0.85);  // G5
    this.scheduleBell(ctx, master, 1046.50, now + 0.68, 0.8, 0.9); // C6

    // Fanfare run 2
    this.scheduleBell(ctx, master, 783.99, now + 1.35, 0.35, 0.75); // G5
    this.scheduleBell(ctx, master, 880.00, now + 1.55, 0.35, 0.8);  // A5
    this.scheduleBell(ctx, master, 987.77, now + 1.75, 0.35, 0.85); // B5
    this.scheduleBell(ctx, master, 1046.50, now + 1.95, 0.7, 0.9);  // C6

    // Celebration finish chord
    this.scheduleBell(ctx, master, 523.25, now + 2.40, 2.0, 0.65); // C5
    this.scheduleBell(ctx, master, 659.25, now + 2.40, 2.0, 0.65); // E5
    this.scheduleBell(ctx, master, 783.99, now + 2.40, 2.0, 0.75); // G5
    this.scheduleBell(ctx, master, 1046.50, now + 2.40, 2.4, 0.95); // C6
  }

  /**
   * 7. Zen Gong (Two deep strikes with rich reverberation)
   */
  private playZenGong(ctx: AudioContext, master: AudioNode, now: number) {
    const playGongStrike = (strikeTime: number) => {
      const freqs = [110, 164.8, 220, 277.2, 440];
      const gains = [0.85, 0.6, 0.5, 0.4, 0.3];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, strikeTime);

        gain.gain.setValueAtTime(0, strikeTime);
        gain.gain.linearRampToValueAtTime(gains[idx], strikeTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.00001, strikeTime + 2.5);

        osc.connect(gain);
        gain.connect(master);

        osc.start(strikeTime);
        osc.stop(strikeTime + 2.6);

        this.stopFns.push(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Ignore
          }
        });
      });
    };

    playGongStrike(now + 0.0);
    playGongStrike(now + 1.9);
  }

  /**
   * 8. Acoustic Marimba (Extended wooden arpeggio phrase)
   */
  private playMarimba(ctx: AudioContext, master: AudioNode, now: number) {
    const playNote = (freq: number, start: number, gainLevel: number = 0.85) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(gainLevel, start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);

      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.45);

      this.stopFns.push(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      });
    };

    // Ascending run
    playNote(523.25, now + 0.00);  // C5
    playNote(587.33, now + 0.12);  // D5
    playNote(659.25, now + 0.24);  // E5
    playNote(783.99, now + 0.36);  // G5
    playNote(880.00, now + 0.48);  // A5
    playNote(1046.50, now + 0.60); // C6

    // Melodic return
    playNote(1318.51, now + 1.20); // E6
    playNote(1174.66, now + 1.34); // D6
    playNote(1046.50, now + 1.48); // C6
    playNote(880.00, now + 1.62);  // A5
    playNote(783.99, now + 1.76);  // G5
    playNote(659.25, now + 1.90);  // E5
    playNote(523.25, now + 2.04);  // C5

    // Concluding chord strike
    playNote(523.25, now + 2.50, 0.7);
    playNote(659.25, now + 2.50, 0.7);
    playNote(783.99, now + 2.50, 0.75);
    playNote(1046.50, now + 2.50, 0.9);
  }
}

export const alarmEngine = new AlarmEngine();
