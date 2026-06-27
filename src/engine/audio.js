// Procedural audio: synthesized SFX and a small chiptune music engine.
// No audio files — everything is generated with the Web Audio API.

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVol = 0.4;
    this.sfxVol = 0.6;
    this.enabled = true;
    this._music = null;
    this._musicTimer = null;
    this._currentTrack = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.master);
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; }
  setSfxVol(v) { this.sfxVol = v; if (this.sfxGain) this.sfxGain.gain.value = v; }

  _now() { return this.ctx.currentTime; }

  tone({ freq = 440, dur = 0.15, type = 'square', vol = 0.3, attack = 0.005, decay = null, slide = 0, dest = null, detune = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const t = this._now();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(dest || this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise({ dur = 0.2, vol = 0.3, lp = 2000, hp = 0, dest = null }) {
    if (!this.ctx || !this.enabled) return;
    const t = this._now();
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    let node = src;
    if (lp) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
    if (hp) { const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    node.connect(g);
    g.connect(dest || this.sfxGain);
    src.start(t);
  }

  // Named SFX
  sfx(name) {
    if (!this.ctx || !this.enabled) return;
    this.resume();
    switch (name) {
      case 'step': this.noise({ dur: 0.06, vol: 0.06, lp: 900 }); break;
      case 'hoe': this.noise({ dur: 0.18, vol: 0.25, lp: 1400 }); this.tone({ freq: 160, dur: 0.12, type: 'triangle', vol: 0.18, slide: -60 }); break;
      case 'water': this.noise({ dur: 0.35, vol: 0.18, lp: 3500, hp: 800 }); break;
      case 'plant': this.tone({ freq: 520, dur: 0.1, type: 'sine', vol: 0.2, slide: 180 }); break;
      case 'chop': this.noise({ dur: 0.12, vol: 0.3, lp: 1200 }); this.tone({ freq: 120, dur: 0.1, type: 'square', vol: 0.18, slide: -40 }); break;
      case 'mine': this.noise({ dur: 0.1, vol: 0.3, lp: 2500, hp: 1000 }); this.tone({ freq: 200, dur: 0.08, type: 'square', vol: 0.16, slide: -80 }); break;
      case 'treefall': this.noise({ dur: 0.7, vol: 0.35, lp: 800 }); break;
      case 'rockbreak': this.noise({ dur: 0.3, vol: 0.35, lp: 1800 }); break;
      case 'harvest': this.tone({ freq: 660, dur: 0.09, type: 'sine', vol: 0.25, slide: 220 }); this.tone({ freq: 880, dur: 0.12, type: 'sine', vol: 0.15, attack: 0.04 }); break;
      case 'pickup': this.tone({ freq: 720, dur: 0.07, type: 'triangle', vol: 0.22, slide: 200 }); break;
      case 'coin': this.tone({ freq: 880, dur: 0.06, type: 'square', vol: 0.2 }); setTimeout(() => this.tone({ freq: 1320, dur: 0.08, type: 'square', vol: 0.18 }), 55); break;
      case 'sell': this.tone({ freq: 600, dur: 0.07, type: 'square', vol: 0.2 }); setTimeout(() => this.tone({ freq: 900, dur: 0.07, type: 'square', vol: 0.2 }), 60); setTimeout(() => this.tone({ freq: 1200, dur: 0.1, type: 'square', vol: 0.18 }), 120); break;
      case 'error': this.tone({ freq: 200, dur: 0.12, type: 'sawtooth', vol: 0.18, slide: -60 }); break;
      case 'select': this.tone({ freq: 520, dur: 0.04, type: 'square', vol: 0.16 }); break;
      case 'confirm': this.tone({ freq: 640, dur: 0.06, type: 'square', vol: 0.18 }); setTimeout(() => this.tone({ freq: 960, dur: 0.07, type: 'square', vol: 0.16 }), 50); break;
      case 'open': this.tone({ freq: 420, dur: 0.08, type: 'triangle', vol: 0.18, slide: 120 }); break;
      case 'close': this.tone({ freq: 420, dur: 0.08, type: 'triangle', vol: 0.18, slide: -120 }); break;
      case 'hit': this.noise({ dur: 0.1, vol: 0.3, lp: 2000 }); this.tone({ freq: 180, dur: 0.08, type: 'square', vol: 0.2, slide: -60 }); break;
      case 'hurt': this.tone({ freq: 300, dur: 0.18, type: 'sawtooth', vol: 0.25, slide: -150 }); break;
      case 'enemydie': this.tone({ freq: 440, dur: 0.2, type: 'square', vol: 0.2, slide: -300 }); this.noise({ dur: 0.15, vol: 0.15, lp: 1500 }); break;
      case 'swing': this.noise({ dur: 0.08, vol: 0.12, lp: 4000, hp: 1500 }); break;
      case 'levelup': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.16, type: 'square', vol: 0.2 }), i * 90)); break;
      case 'quest': [659, 784, 988].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.2 }), i * 80)); break;
      case 'newday': [392, 523, 659, 523].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.2, type: 'sine', vol: 0.18 }), i * 110)); break;
      case 'fish_bite': this.tone({ freq: 880, dur: 0.06, type: 'square', vol: 0.2 }); setTimeout(() => this.tone({ freq: 880, dur: 0.06, type: 'square', vol: 0.2 }), 90); break;
      case 'fish_catch': [523, 659, 880].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.12, type: 'sine', vol: 0.2 }), i * 70)); break;
      case 'splash': this.noise({ dur: 0.3, vol: 0.22, lp: 3000, hp: 600 }); break;
      case 'eat': this.noise({ dur: 0.1, vol: 0.12, lp: 800 }); this.tone({ freq: 300, dur: 0.08, type: 'triangle', vol: 0.12 }); break;
      case 'craft': this.tone({ freq: 440, dur: 0.1, type: 'square', vol: 0.16 }); setTimeout(() => this.tone({ freq: 660, dur: 0.12, type: 'square', vol: 0.16 }), 80); break;
      case 'door': this.noise({ dur: 0.2, vol: 0.14, lp: 1200 }); break;
      case 'sleep': [440, 392, 349, 294].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.25, type: 'sine', vol: 0.16 }), i * 130)); break;
      case 'bird': { const b = 1800 + Math.random() * 900; this.tone({ freq: b, dur: 0.08, type: 'sine', vol: 0.05, slide: 300 }); setTimeout(() => this.tone({ freq: b + 200, dur: 0.07, type: 'sine', vol: 0.045, slide: -200 }), 90); break; }
      case 'cricket': { for (let i = 0; i < 3; i++) setTimeout(() => this.tone({ freq: 4200, dur: 0.02, type: 'triangle', vol: 0.03 }), i * 45); break; }
      case 'owl': this.tone({ freq: 320, dur: 0.18, type: 'sine', vol: 0.05, slide: -40 }); setTimeout(() => this.tone({ freq: 300, dur: 0.22, type: 'sine', vol: 0.05, slide: -30 }), 220); break;
      case 'wave': this.noise({ dur: 0.6, vol: 0.05, lp: 1400, hp: 300 }); break;
      default: break;
    }
  }

  // --- Simple chiptune sequencer. Tracks are arrays of {n, d} notes. ---
  playMusic(trackName) {
    if (!this.ctx || !this.enabled) return;
    if (this._currentTrack === trackName) return;
    this.stopMusic();
    this._currentTrack = trackName;
    const track = MUSIC[trackName];
    if (!track) return;
    this._music = { track, step: 0 };
    const bpm = track.bpm || 100;
    const stepDur = 60 / bpm / 2; // eighth notes
    const tick = () => {
      if (!this._music || this._currentTrack !== trackName) return;
      const m = this._music;
      const mel = m.track.melody;
      const bass = m.track.bass;
      const i = m.step % mel.length;
      const note = mel[i];
      if (note > 0) this.tone({ freq: noteFreq(note), dur: stepDur * 0.95, type: m.track.lead || 'square', vol: 0.12, dest: this.musicGain });
      if (bass) {
        const bi = m.step % bass.length;
        const bn = bass[bi];
        if (bn > 0) this.tone({ freq: noteFreq(bn) / 2, dur: stepDur * 1.6, type: 'triangle', vol: 0.14, dest: this.musicGain });
      }
      m.step++;
      this._musicTimer = setTimeout(tick, stepDur * 1000);
    };
    tick();
  }

  stopMusic() {
    if (this._musicTimer) clearTimeout(this._musicTimer);
    this._musicTimer = null;
    this._music = null;
    this._currentTrack = null;
  }
}

// MIDI-ish note numbers -> frequency. 0 = rest.
function noteFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

// Note name helper for readability
const N = {
  C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
  C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
  C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81,
};

const MUSIC = {
  title: {
    bpm: 96, lead: 'triangle',
    melody: [N.C4, N.E4, N.G4, N.C5, N.B4, N.G4, N.E4, N.G4, N.A4, N.F4, N.A4, N.C5, N.G4, 0, N.E4, 0],
    bass: [N.C3, 0, N.G3, 0, N.A3, 0, N.F3, 0],
  },
  farm_spring: {
    bpm: 104, lead: 'square',
    melody: [N.G4, N.A4, N.B4, N.D5, N.B4, N.A4, N.G4, 0, N.E4, N.G4, N.A4, N.B4, N.A4, N.G4, N.E4, 0,
             N.D4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, 0, N.C4, N.E4, N.G4, N.C5, N.B4, N.G4, N.E4, 0],
    bass: [N.G3, 0, N.D3, 0, N.E3, 0, N.C3, 0],
  },
  farm_summer: {
    bpm: 116, lead: 'square',
    melody: [N.A4, N.C5, N.B4, N.A4, N.G4, N.A4, N.E4, 0, N.F4, N.A4, N.G4, N.F4, N.E4, N.C4, N.E4, 0],
    bass: [N.A3, 0, N.E3, 0, N.F3, 0, N.C3, 0],
  },
  farm_fall: {
    bpm: 92, lead: 'triangle',
    melody: [N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.E4, 0, N.C4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, 0],
    bass: [N.A3, 0, N.E3, 0, N.C3, 0, N.G3, 0],
  },
  farm_winter: {
    bpm: 80, lead: 'sine',
    melody: [N.C4, N.E4, N.G4, N.E4, N.A4, N.G4, N.E4, 0, N.D4, N.F4, N.A4, N.F4, N.G4, N.E4, N.C4, 0],
    bass: [N.C3, 0, N.A3, 0, N.F3, 0, N.G3, 0],
  },
  town: {
    bpm: 120, lead: 'square',
    melody: [N.C5, N.B4, N.A4, N.G4, N.A4, N.B4, N.C5, 0, N.E4, N.G4, N.C5, N.G4, N.E4, N.D4, N.C4, 0],
    bass: [N.C3, N.G3, N.A3, N.E3, N.F3, N.C3, N.G3, N.G3],
  },
  mine: {
    bpm: 88, lead: 'sawtooth',
    melody: [N.A3, 0, N.C4, 0, N.B3, 0, N.E4, 0, N.A3, 0, N.G3, 0, N.A3, 0, 0, 0],
    bass: [N.A3, 0, 0, 0, N.E3, 0, 0, 0],
  },
  shop: {
    bpm: 110, lead: 'triangle',
    melody: [N.E4, N.G4, N.C5, N.G4, N.A4, N.C5, N.E5, N.C5, N.D5, N.B4, N.G4, N.B4, N.C5, 0, 0, 0],
    bass: [N.C3, 0, N.G3, 0, N.A3, 0, N.F3, 0],
  },
};
