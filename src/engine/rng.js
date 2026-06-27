// Deterministic seeded RNG (mulberry32) + helpers.
// Used for procedural sprites, world gen, and reproducible randomness.

export function hashStr(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class RNG {
  constructor(seed = 0) {
    this.seed(seed);
  }
  seed(s) {
    this.state = (typeof s === 'string' ? hashStr(s) : s >>> 0) || 1;
    return this;
  }
  // mulberry32
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  bool(p = 0.5) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Weighted pick: entries is array of [value, weight].
  weighted(entries) {
    let total = 0;
    for (const [, w] of entries) total += w;
    let r = this.next() * total;
    for (const [v, w] of entries) {
      if ((r -= w) <= 0) return v;
    }
    return entries[entries.length - 1][0];
  }
  sign() { return this.next() < 0.5 ? -1 : 1; }
  angle() { return this.next() * Math.PI * 2; }
}

// Global convenience RNG (non-deterministic seed at boot).
export const rng = new RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
