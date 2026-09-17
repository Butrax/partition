/**
 * High quality Web Audio synthesizer for acoustic piano notes and feedback sounds
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playPianoNote(frequency: number, duration: number = 1.2) {
    this.playNote(frequency, duration);
  }

  /**
   * Synthesizes a realistic piano tone using layered harmonics and an exponential decay envelope.
   */
  public playNote(frequency: number, duration: number = 1.2) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain for this note
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.015); // sharp attack
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Harmonic partials (fundamental + harmonics to emulate rich piano timbre)
    const harmonics = [
      { mult: 1.0, gain: 0.7, type: 'triangle' as OscillatorType },
      { mult: 2.0, gain: 0.35, type: 'sine' as OscillatorType },
      { mult: 3.0, gain: 0.18, type: 'sine' as OscillatorType },
      { mult: 4.0, gain: 0.08, type: 'sine' as OscillatorType },
    ];

    harmonics.forEach(h => {
      if (frequency * h.mult > 18000) return;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = h.type;
      osc.frequency.setValueAtTime(frequency * h.mult, now);

      oscGain.gain.setValueAtTime(h.gain, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });

    // Cleanup
    setTimeout(() => {
      masterGain.disconnect();
    }, duration * 1000 + 100);
  }

  /**
   * Plays a success chime sound
   */
  public playSuccess() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25]; // C5, E5 rapid arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  }

  /**
   * Plays a gentle mistake sound (non-jarring)
   */
  public playError() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(146.83, now); // D3
    osc.frequency.linearRampToValueAtTime(110.0, now + 0.18); // downwards glide

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    // Low pass filter to soften the buzz
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Level up / High score celebration fanfare
   */
  public playFanfare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
}

export const soundEngine = new SoundEngine();
