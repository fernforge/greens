// Fishing minigame: cast -> wait for a bite -> a bar/timing catch challenge.
// Self-contained state machine driven by the game loop & input.
import { FISH } from '../data/fish.js';
import { RNG } from '../../engine/rng.js';

export class Fishing {
  constructor() { this.reset(); this.rng = new RNG((Date.now() & 0xffff) + 3); }
  reset() {
    this.state = 'idle';   // idle | casting | waiting | bite | reeling | caught | missed
    this.t = 0;
    this.barPos = 0.5;     // green zone center (0..1)
    this.barVel = 0;
    this.fishPos = 0.5;    // fish position (0..1)
    this.fishVel = 0;
    this.fishTarget = 0.5;
    this.progress = 0.5;   // catch progress 0..1
    this.zone = 0.22;      // green zone half-height
    this.fish = null;
    this.biteWindow = 0;
    this.result = null;
    this.message = '';
  }

  // location: 'pond'|'river'|'ocean'|'cave'; season idx
  start(location, season, fishingLevel) {
    this.reset();
    this.location = location; this.season = season; this.level = fishingLevel;
    this.state = 'waiting';
    this.t = this.rng.range(1.2, 4.0);   // time until bite
    this.zone = 0.18 + fishingLevel * 0.012;
  }

  _rollFish() {
    const cands = FISH.filter((f) => f.location.includes(this.location) && (f.season === 'all' || f.season.includes(this.season)));
    if (!cands.length) return FISH[0];
    // weight inversely by difficulty, but allow rare hard fish
    const entries = cands.map((f) => [f, 1 / (f.difficulty + (f.difficulty > this.level + 2 ? 6 : 0))]);
    return this.rng.weighted(entries);
  }

  update(dt, input) {
    if (this.state === 'waiting') {
      this.t -= dt;
      if (this.t <= 0) {
        this.fish = this._rollFish();
        this.state = 'bite';
        this.biteWindow = 0.9;
      }
      // allow early cancel
      if (input.justPressed('use') || input.mouse.pressed) { /* keep waiting; tug */ }
    } else if (this.state === 'bite') {
      this.biteWindow -= dt;
      if (input.justPressed('use') || input.mouse.pressed) {
        this.state = 'reeling';
        this.progress = 0.5; this.barPos = 0.45; this.barVel = 0;
        this.fishPos = 0.5; this.fishTarget = 0.5; this.fishVel = 0;
        this._fishMoveCd = 0;
        return 'hooked';
      }
      if (this.biteWindow <= 0) { this.state = 'missed'; this.message = 'It got away…'; this.t = 1.2; return 'missed'; }
    } else if (this.state === 'reeling') {
      // player controls bar: hold use to rise, release to fall
      const up = input.held('use') || input.mouse.down;
      this.barVel += (up ? -0.9 : 0.9) * dt;
      this.barVel *= 0.92;
      this.barPos += this.barVel * dt;
      if (this.barPos < this.zone) { this.barPos = this.zone; this.barVel = 0; }
      if (this.barPos > 1 - this.zone) { this.barPos = 1 - this.zone; this.barVel = 0; }
      // fish darts around based on difficulty
      this._fishMoveCd -= dt;
      if (this._fishMoveCd <= 0) {
        this._fishMoveCd = this.rng.range(0.4, 1.1) / (1 + this.fish.difficulty * 0.08);
        this.fishTarget = this.rng.range(0.1, 0.9);
      }
      this.fishVel += (this.fishTarget - this.fishPos) * dt * (2 + this.fish.difficulty * 0.5);
      this.fishVel *= 0.9;
      this.fishPos += this.fishVel * dt;
      this.fishPos = Math.max(0.05, Math.min(0.95, this.fishPos));
      // overlap?
      const overlap = Math.abs(this.fishPos - this.barPos) < this.zone;
      this.progress += (overlap ? 0.42 : -0.34) * dt;
      this.progress = Math.max(0, Math.min(1, this.progress));
      if (this.progress >= 1) { this.state = 'caught'; this.result = this.fish; return 'caught'; }
      if (this.progress <= 0) { this.state = 'missed'; this.message = 'The line snapped!'; this.t = 1.2; return 'missed'; }
    } else if (this.state === 'missed') {
      this.t -= dt;
      if (this.t <= 0) this.state = 'done';
    }
    return null;
  }
}
