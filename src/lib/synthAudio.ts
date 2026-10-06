/**
 * Web Audio API Synthesizer Engine for offline-capable, royalty-free presentation background music.
 */

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSources: { node: AudioNode; stop?: () => void }[] = [];
  private activeIntervals: number[] = [];
  private currentVolume: number = 0.5;
  private currentType: 'ambient' | 'rain' | 'metronome' | 'stream' | 'energetic' | null = null;
  private isRunning: boolean = false;
  private chordIndex: number = 0;

  constructor() {
    // Lazy loaded to avoid browser block
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.error('Failed to initialize AudioContext:', err);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
    }
  }

  public start(type: 'ambient' | 'rain' | 'metronome' | 'stream' | 'energetic') {
    this.stop();
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.isRunning = true;

    if (type === 'ambient') {
      this.startAmbient();
    } else if (type === 'rain') {
      this.startRain();
    } else if (type === 'stream') {
      this.startStream();
    } else if (type === 'energetic') {
      this.startEnergetic();
    } else if (type === 'metronome') {
      this.startMetronome();
    }
  }

  public stop() {
    this.isRunning = false;
    this.currentType = null;

    // Stop and disconnect all active sources
    this.activeSources.forEach((src) => {
      try {
        if (src.stop) {
          src.stop();
        } else if ((src.node as any).stop) {
          (src.node as any).stop();
        }
        src.node.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeSources = [];

    // Clear all intervals
    this.activeIntervals.forEach((intervalId) => {
      window.clearInterval(intervalId);
    });
    this.activeIntervals = [];
  }

  public getActiveTrack(): 'ambient' | 'rain' | 'metronome' | 'stream' | 'energetic' | null {
    return this.isRunning ? this.currentType : null;
  }

  // --- Track 1: Space Ambient Drone (Warm Pads & Moving Chords) ---
  private startAmbient() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Warm chords: Cmaj9, Fmaj9, Am9, G6
    const chords = [
      [130.81, 164.81, 196.00, 246.94, 293.66], // C3, E3, G3, B3, D4
      [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4
      [110.00, 146.83, 174.61, 220.00, 261.63], // A2, D3, F3, A3, C4
      [146.83, 196.00, 246.94, 293.66, 392.00], // D3, G3, B3, D4, G4
    ];

    this.chordIndex = 0;

    const playChord = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const currentChord = chords[this.chordIndex];
      this.chordIndex = (this.chordIndex + 1) % chords.length;

      // Trigger standard warm sine/triangle voices with slow fade-in and fade-out
      const duration = 7.5; // 7.5 seconds per chord, with overlap
      const voices: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      currentChord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Alternate osc types for rich harmonics
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Slow attack
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06 / currentChord.length, now + 2.5 + idx * 0.2);
        
        // Slow decay / release
        gain.gain.setValueAtTime(0.06 / currentChord.length, now + duration - 2.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        // Lowpass filter to keep it extremely warm and non-distracting
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + idx * 100, now);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(master);

        osc.start(now);
        osc.stop(now + duration);

        voices.push(osc);
        gains.push(gain);

        this.activeSources.push({
          node: osc,
          stop: () => {
            try { osc.stop(); } catch(e){}
          }
        });
      });

      // Periodic garbage collection of stopped voices from activeSources
      setTimeout(() => {
        this.activeSources = this.activeSources.filter(src => {
          const isFinished = (src.node as any).playbackState === 3 || ctx.currentTime > now + duration;
          return !isFinished;
        });
      }, duration * 1000 + 100);
    };

    // Play first chord immediately
    playChord();

    // Loop chords every 6.5 seconds (leaving 1 second overlap)
    const interval = window.setInterval(playChord, 6500);
    this.activeIntervals.push(interval);
  }

  // --- Track 2: White Noise Rain with Wind LFO ---
  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // 1. Generate a white noise buffer
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // 2. Play the buffer in a loop
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // 3. Configure bandpass filtering for rain feel
    const biquadFilter = ctx.createBiquadFilter();
    biquadFilter.type = 'bandpass';
    biquadFilter.frequency.setValueAtTime(600, ctx.currentTime);
    biquadFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    // 4. Lowpass filter to make it softer
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, ctx.currentTime);

    // 5. Volume envelope with an LFO for natural wave-like variations
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.08, ctx.currentTime);

    // Modulator oscillator (LFO) for wave sweeps
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // very slow, 0.15 Hz

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.03, ctx.currentTime); // swing volume +/- 0.03

    // Hook up LFO to rainGain
    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);

    // Connect noise to master
    noiseNode.connect(biquadFilter);
    biquadFilter.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(master);

    noiseNode.start(0);
    lfo.start(0);

    this.activeSources.push({
      node: noiseNode,
      stop: () => {
        try { noiseNode.stop(); } catch(e){}
        try { lfo.stop(); } catch(e){}
      }
    });

    // Generate random soft droplets periodically
    const triggerDroplet = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // High pitch drop
      const pitch = 1500 + Math.random() * 800;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.005, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.08);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.1);
    };

    const dropInterval = window.setInterval(() => {
      // Trigger droplet randomly
      if (Math.random() > 0.3) {
        triggerDroplet();
      }
    }, 400);
    this.activeIntervals.push(dropInterval);
  }

  // --- Track 3: Water Stream & Singing Birds (Suối chảy & Chim hót) ---
  private startStream() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // 1. Water stream flow (Gentle bandpassed noise + LFO)
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const streamSource = ctx.createBufferSource();
    streamSource.buffer = noiseBuffer;
    streamSource.loop = true;

    // Filter to sound like rushing stream water
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(550, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.09, ctx.currentTime);

    // Flow modulation LFO for water waves
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.25, ctx.currentTime); // 0.25 Hz

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.025, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(streamGain.gain);

    streamSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(streamGain);
    streamGain.connect(master);

    streamSource.start(0);
    lfo.start(0);

    this.activeSources.push({
      node: streamSource,
      stop: () => {
        try { streamSource.stop(); } catch(e){}
        try { lfo.stop(); } catch(e){}
      }
    });

    // 2. Water trickling / bubbling sounds
    const playBubble = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 300 + Math.random() * 350;
      osc.frequency.setValueAtTime(baseFreq, now);
      // Extremely fast upward sweep creates a cute bubbling / splash sound
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.007, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.06);
    };

    const bubbleInterval = window.setInterval(() => {
      if (Math.random() > 0.2) {
        playBubble();
      }
    }, 150);
    this.activeIntervals.push(bubbleInterval);

    // 3. Singing Birds
    const playBirdChirp = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      
      const numChirps = 2 + Math.floor(Math.random() * 3);
      let chirpDelay = 0;
      
      for (let i = 0; i < numChirps; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        
        const startFreq = 2300 + Math.random() * 1000;
        const endFreq = startFreq + 1000 + Math.random() * 800;
        const duration = 0.06 + Math.random() * 0.05;
        
        osc.frequency.setValueAtTime(startFreq, now + chirpDelay);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + chirpDelay + duration);
        
        gain.gain.setValueAtTime(0, now + chirpDelay);
        gain.gain.linearRampToValueAtTime(0.015, now + chirpDelay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + chirpDelay + duration);
        
        osc.connect(gain);
        gain.connect(master);
        
        osc.start(now + chirpDelay);
        osc.stop(now + chirpDelay + duration);
        
        chirpDelay += duration + 0.03 + Math.random() * 0.05;
      }
    };

    // Chirp every 3 to 6 seconds
    const birdInterval = window.setInterval(() => {
      if (Math.random() > 0.4) {
        playBirdChirp();
      }
    }, 3500);
    this.activeIntervals.push(birdInterval);
  }

  // --- Track 4: Energetic & Upbeat Synth (Nhạc hào hứng, năng động) ---
  private startEnergetic() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // 124 BPM -> 1 beat = 0.484 seconds. 8th note step = 0.242 seconds.
    const stepLen = 60 / 124 / 2; 
    let stepCount = 0;

    // Upbeat Positive chords: I - V - vi - IV progression
    // Chord roots: F3, C3, D3, Bb2
    const chords = [
      { root: 174.61, notes: [174.61, 220.00, 261.63, 349.23] }, // F3, A3, C4, F4
      { root: 130.81, notes: [130.81, 164.81, 196.00, 261.63] }, // C3, E3, G3, C4
      { root: 146.83, notes: [146.83, 174.61, 220.00, 293.66] }, // D3, F3, A3, D4
      { root: 116.54, notes: [116.54, 146.83, 174.61, 233.08] }  // Bb2, D3, F3, Bb3
    ];

    const playEnergeticStep = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      // Chord index changes every 16 steps (8 beats)
      const chordIdx = Math.floor(stepCount / 16) % chords.length;
      const currentChord = chords[chordIdx];
      const stepInMeasure = stepCount % 16;

      // 1. Energetic Octave Bassline
      if (stepInMeasure % 2 === 0 || stepInMeasure % 4 === 3) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sawtooth';

        const isOctaveUp = stepInMeasure % 4 === 2 || stepInMeasure % 4 === 3;
        const bassFreq = isOctaveUp ? currentChord.root * 2 : currentChord.root;

        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.04, now + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.00001, now + stepLen * 0.95);

        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(280, now);

        bassOsc.connect(bassGain);
        bassGain.connect(bassFilter);
        bassFilter.connect(master);

        bassOsc.start(now);
        bassOsc.stop(now + stepLen);
      }

      // 2. Upbeat Arpeggiator Pluck (Plays bright, melodic 8th note run)
      const arpPattern = [0, 1, 2, 3, 2, 1, 3, 0];
      const arpNoteIdx = arpPattern[stepInMeasure % arpPattern.length];
      const arpFreq = currentChord.notes[arpNoteIdx] * 2;

      const pluckOsc = ctx.createOscillator();
      const pluckGain = ctx.createGain();
      
      pluckOsc.type = stepInMeasure % 4 === 1 ? 'square' : 'triangle';
      pluckOsc.frequency.setValueAtTime(arpFreq, now);

      pluckGain.gain.setValueAtTime(0, now);
      pluckGain.gain.linearRampToValueAtTime(0.025, now + 0.01);
      pluckGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.14);

      const pluckFilter = ctx.createBiquadFilter();
      pluckFilter.type = 'lowpass';
      pluckFilter.frequency.setValueAtTime(1500, now);

      pluckOsc.connect(pluckGain);
      pluckGain.connect(pluckFilter);
      pluckFilter.connect(master);

      pluckOsc.start(now);
      pluckOsc.stop(now + 0.15);

      // 3. Upbeat Shaker / Hi-Hat
      const isOffbeat = stepInMeasure % 4 === 2;
      const isOnbeat = stepInMeasure % 4 === 0;
      if (isOffbeat || (Math.random() > 0.7 && !isOnbeat)) {
        const noiseNode = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(6000, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(isOffbeat ? 0.012 : 0.005, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.035);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);

        noiseNode.start(now);
      }

      stepCount++;
    };

    // Play first step immediately
    playEnergeticStep();

    // Schedule upbeat steps
    const energeticInterval = window.setInterval(playEnergeticStep, stepLen * 1000);
    this.activeIntervals.push(energeticInterval);
  }

  // --- Track 4: Hypnotic Lofi Pulse (Rhythmic ticking for tracking time) ---
  private startMetronome() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Tempo: 70 BPM (0.857s per beat)
    const beatLen = 60 / 70; 
    let beatCount = 0;

    const playBeat = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = ctx.currentTime;

      // 1. Cozy warm low synth bass note on beat 1 and 3
      if (beatCount % 4 === 0 || beatCount % 4 === 2) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        
        // C2 on beat 1, G1 on beat 3
        const freq = beatCount % 4 === 0 ? 65.41 : 49.00;
        bassOsc.frequency.setValueAtTime(freq, now);

        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);

        bassOsc.connect(bassGain);
        bassGain.connect(filter);
        filter.connect(master);

        bassOsc.start(now);
        bassOsc.stop(now + 0.6);
      }

      // 2. Soft woodblock ticking on every beat (high pitch triangle)
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'sine';
      
      // Accent on beat 1
      const isAccent = beatCount % 4 === 0;
      tickOsc.frequency.setValueAtTime(isAccent ? 1200 : 900, now);

      tickGain.gain.setValueAtTime(0, now);
      tickGain.gain.linearRampToValueAtTime(isAccent ? 0.015 : 0.008, now + 0.002);
      tickGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.04);

      tickOsc.connect(tickGain);
      tickGain.connect(master);

      tickOsc.start(now);
      tickOsc.stop(now + 0.05);

      // 3. Super soft filtered shaker on beat 2 and 4 (very short noise burst)
      if (beatCount % 4 === 1 || beatCount % 4 === 3) {
        const noiseNode = ctx.createBufferSource();
        // Generate small noise buffer
        const bufferSize = ctx.sampleRate * 0.05; // 50ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(4000, now);
        noiseFilter.Q.setValueAtTime(2.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.04);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);

        noiseNode.start(now);
      }

      beatCount++;
    };

    // Play first beat
    playBeat();

    // Beat timer
    const beatInterval = window.setInterval(playBeat, beatLen * 1000);
    this.activeIntervals.push(beatInterval);
  }
}

// Single active instance
export const synthEngine = new SynthEngine();
