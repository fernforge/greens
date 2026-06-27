// Villager entity: wanders gently around a home point in its area. Facing the
// NPC and interacting opens dialogue. Sprites come from Assets.npcs[id].
import { TILE } from '../../engine/spritegen.js';
import { RNG } from '../../engine/rng.js';
import { dirFromVec } from '../../engine/math.js';

// Map an NPC's declared home to an area id and a home tile.
export const NPC_AREA = {
  mara: { area: 'town', tx: 22, ty: 10 },
  gus: { area: 'town', tx: 8, ty: 20 },
  edith: { area: 'town', tx: 40, ty: 20 },
  rosa: { area: 'town', tx: 30, ty: 24 },
  theo: { area: 'beach', tx: 22, ty: 13 },
  pip: { area: 'forest', tx: 12, ty: 20 },
  nina: { area: 'forest', tx: 20, ty: 30 },
  bram: { area: 'mine_entrance', tx: 5, ty: 8 },
};

export class NPC {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    const home = NPC_AREA[def.id] || { area: 'town', tx: 22, ty: 16 };
    this.area = home.area;
    this.hx = home.tx * TILE; this.hy = home.ty * TILE;
    this.x = this.hx; this.y = this.hy;
    this.dir = 'down';
    this.moving = false;
    this.animT = 0; this.frame = 0;
    this.rng = new RNG(def.id.length * 41 + 13);
    this.wanderT = this.rng.range(1, 4);
    this.tx = 0; this.ty = 0;
    this.idle = true;
  }
  get cx() { return this.x + 8; }
  get feetY() { return this.y + 22; }
  get tileX() { return Math.floor(this.cx / TILE); }
  get tileY() { return Math.floor(this.feetY / TILE); }

  update(dt, area, paused) {
    this.animT += dt;
    if (paused) { this.moving = false; return; }
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.idle = this.rng.bool(0.4);
      this.wanderT = this.rng.range(1.5, 4.5);
      if (!this.idle) {
        const a = this.rng.angle();
        this.tx = Math.cos(a); this.ty = Math.sin(a);
        this.dir = dirFromVec(this.tx, this.ty);
      }
    }
    if (!this.idle) {
      const sp = 22 * dt;
      let nx = this.x + this.tx * sp, ny = this.y + this.ty * sp;
      // leash to home
      if (Math.hypot(nx - this.hx, ny - this.hy) > 56) { this.tx *= -1; this.ty *= -1; this.dir = dirFromVec(this.tx, this.ty); }
      else if (!area.rectCollides(nx + 3, ny + 16, 10, 6)) { this.x = nx; this.y = ny; this.moving = true; }
      else { this.wanderT = 0.2; this.idle = true; }
      this.frame = Math.floor(this.animT * 7) % 4;
    } else { this.moving = false; this.frame = 0; }
  }

  sprite(frames) {
    const set = frames[this.dir] || frames.down;
    return set[this.moving ? this.frame : 0];
  }
}
