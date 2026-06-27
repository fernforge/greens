// Area / TileMap model: ground tiles, objects, warps, collision, and the
// per-tile farmland state used on the farm.
import { TILE } from '../../engine/spritegen.js';
import { T, SOLID_TILES, TILLABLE, WATER_TILES } from './tiles.js';

let OBJ_ID = 1;
export function nextObjId() { return OBJ_ID++; }

// Object metadata: footprint + behaviour. w/h in tiles for solid footprint.
export const OBJ_META = {
  tree:    { solid: true, fw: 1, fh: 1, anchorTx: 0, anchorTy: 0, hp: 4, type: 'tree' },
  tree2:   { solid: true, fw: 1, fh: 1, hp: 4 },
  stump:   { solid: true, fw: 1, fh: 1, hp: 2 },
  rock:    { solid: true, fw: 1, fh: 1, hp: 2 },
  ore:     { solid: true, fw: 1, fh: 1, hp: 3 },
  bush:    { solid: true, fw: 1, fh: 1, hp: 2 },
  weed:    { solid: false, hp: 1 },
  forage:  { solid: false, hp: 1 },
  log:     { solid: true, fw: 1, fh: 1, hp: 3 },
  building:{ solid: true },         // fw/fh per instance
  sign:    { solid: true, fw: 1, fh: 1 },
  fence:   { solid: true, fw: 1, fh: 1, hp: 2 },
  gate:    { solid: false, fw: 1, fh: 1 },
  chest:   { solid: true, fw: 1, fh: 1 },
  sprinkler:{ solid: false },
  scarecrow:{ solid: true, fw: 1, fh: 1 },
  torch:   { solid: false },
  stone_path:{ solid: false },
  ladder:  { solid: false, fw: 1, fh: 1 },
  ladder_up:{ solid: false, fw: 1, fh: 1 },
};

export class Area {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.w = def.w; this.h = def.h;
    this.kind = def.kind || 'outdoor';        // outdoor | indoor | cave | town
    this.music = def.music || null;
    this.ground = def.ground || new Int16Array(this.w * this.h);
    this.objects = def.objects || [];
    this.warps = def.warps || [];
    this.farmland = def.farmland || new Map();  // "x,y" -> plot
    this.spawnsEnemies = def.spawnsEnemies || false;
    this.depth = def.depth || 0;
    this.lit = def.lit ?? (this.kind === 'cave' ? false : true);
  }

  get pxW() { return this.w * TILE; }
  get pxH() { return this.h * TILE; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h; }
  idx(tx, ty) { return ty * this.w + tx; }

  tileAt(tx, ty) { return this.inBounds(tx, ty) ? this.ground[this.idx(tx, ty)] : T.water_deep; }
  setTile(tx, ty, code) { if (this.inBounds(tx, ty)) this.ground[this.idx(tx, ty)] = code; }

  objectAt(tx, ty) {
    for (const o of this.objects) {
      const m = OBJ_META[o.type] || {};
      const fw = o.fw ?? m.fw ?? 1, fh = o.fh ?? m.fh ?? 1;
      if (tx >= o.tx && tx < o.tx + fw && ty >= o.ty && ty < o.ty + fh) return o;
    }
    return null;
  }
  // First solid object overlapping a tile (for collision).
  solidObjectAt(tx, ty) {
    for (const o of this.objects) {
      const m = OBJ_META[o.type] || {};
      const solid = o.solid ?? m.solid;
      if (!solid) continue;
      const fw = o.fw ?? m.fw ?? 1, fh = o.fh ?? m.fh ?? 1;
      if (tx >= o.tx && tx < o.tx + fw && ty >= o.ty && ty < o.ty + fh) return o;
    }
    return null;
  }

  addObject(o) { o.id = o.id || nextObjId(); this.objects.push(o); return o; }
  removeObject(o) {
    const i = this.objects.indexOf(o);
    if (i >= 0) this.objects.splice(i, 1);
  }

  // Pixel-level collision for an AABB (used by entities). Returns true if solid.
  rectCollides(px, py, w, h) {
    const x0 = Math.floor(px / TILE), x1 = Math.floor((px + w - 1) / TILE);
    const y0 = Math.floor(py / TILE), y1 = Math.floor((py + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.inBounds(tx, ty)) return true;
        if (SOLID_TILES.has(this.tileAt(tx, ty))) return true;
        if (this.solidObjectAt(tx, ty)) return true;
      }
    }
    return false;
  }

  isWater(tx, ty) { return WATER_TILES.has(this.tileAt(tx, ty)); }
  tillable(tx, ty) {
    if (!this.inBounds(tx, ty)) return false;
    if (this.objectAt(tx, ty)) return false;
    return TILLABLE.has(this.tileAt(tx, ty)) || this.kind === 'farm' && this.tileAt(tx, ty) === T.dirt;
  }

  // --- farmland helpers ---
  plotKey(tx, ty) { return tx + ',' + ty; }
  plotAt(tx, ty) { return this.farmland.get(this.plotKey(tx, ty)); }
  till(tx, ty) {
    const k = this.plotKey(tx, ty);
    if (this.farmland.has(k)) return false;
    this.farmland.set(k, { tx, ty, tilled: true, watered: false, cropId: null, stage: 0, age: 0, regrowReady: false, dead: false, daysUnwatered: 0, fertilized: false });
    return true;
  }
  warpAt(tx, ty) {
    for (const wp of this.warps) {
      if (tx >= wp.x && tx < wp.x + wp.w && ty >= wp.y && ty < wp.y + wp.h) return wp;
    }
    return null;
  }

  // Serialize dynamic state.
  serialize() {
    return {
      id: this.id,
      ground: Array.from(this.ground),
      objects: this.objects.map((o) => ({ ...o })),
      farmland: Array.from(this.farmland.entries()),
      depth: this.depth,
    };
  }
}
