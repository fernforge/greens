// Inventory: a fixed grid of stackable slots, plus a hotbar (first 12 slots).
import { ITEMS } from '../data/items.js';

export const INV_SIZE = 36;
export const HOTBAR_SIZE = 12;

export class Inventory {
  constructor(size = INV_SIZE) {
    this.size = size;
    this.slots = new Array(size).fill(null); // {id, count}
  }

  stackMax(id) { return ITEMS[id]?.stack ?? 999; }

  count(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.count;
    return n;
  }
  has(id, n = 1) { return this.count(id) >= n; }

  firstEmpty() { return this.slots.findIndex((s) => s === null); }

  // Add items; returns leftover that didn't fit (0 = all fit).
  add(id, n = 1) {
    if (n <= 0) return 0;
    const max = this.stackMax(id);
    // top up existing stacks
    for (const s of this.slots) {
      if (s && s.id === id && s.count < max) {
        const room = max - s.count;
        const take = Math.min(room, n);
        s.count += take; n -= take;
        if (n <= 0) return 0;
      }
    }
    // new stacks
    while (n > 0) {
      const i = this.firstEmpty();
      if (i < 0) return n;
      const take = Math.min(max, n);
      this.slots[i] = { id, count: take };
      n -= take;
    }
    return 0;
  }
  canFit(id, n = 1) {
    const max = this.stackMax(id);
    let space = 0;
    for (const s of this.slots) {
      if (s === null) space += max;
      else if (s.id === id) space += max - s.count;
      if (space >= n) return true;
    }
    return space >= n;
  }

  // Remove n of id; returns true if fully removed.
  remove(id, n = 1) {
    if (this.count(id) < n) return false;
    for (let i = 0; i < this.slots.length && n > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id) {
        const take = Math.min(s.count, n);
        s.count -= take; n -= take;
        if (s.count <= 0) this.slots[i] = null;
      }
    }
    return true;
  }
  removeSlot(i, n = 1) {
    const s = this.slots[i];
    if (!s) return null;
    const take = Math.min(s.count, n);
    s.count -= take;
    const out = { id: s.id, count: take };
    if (s.count <= 0) this.slots[i] = null;
    return out;
  }
  swap(i, j) { const t = this.slots[i]; this.slots[i] = this.slots[j]; this.slots[j] = t; }

  serialize() { return this.slots.map((s) => (s ? [s.id, s.count] : 0)); }
  load(arr) {
    this.slots = new Array(this.size).fill(null);
    arr.forEach((s, i) => { if (s) this.slots[i] = { id: s[0], count: s[1] }; });
  }
}
