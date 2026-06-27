// Cave enemy entity with simple chase/wander AI.
import { TILE } from '../../engine/spritegen.js';
import { ENEMIES } from '../data/enemies.js';
import { RNG } from '../../engine/rng.js';

let EID = 1;
export class Enemy {
  constructor(type, x, y) {
    this.eid = EID++;
    this.type = type;
    const def = ENEMIES[type];
    this.def = def;
    this.x = x; this.y = y;
    this.w = 14; this.h = 12;
    this.hp = def.hp; this.maxHp = def.hp;
    this.vx = 0; this.vy = 0;
    this.hurtT = 0; this.stun = 0;
    this.dead = false;
    this.dir = 1;
    this.bob = Math.random() * Math.PI * 2;
    this.wanderT = 0; this.wx = 0; this.wy = 0;
    this.atkCd = 0;
    this.rng = new RNG(this.eid * 31 + 7);
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(dt, player, area) {
    if (this.dead) return;
    this.bob += dt * 6;
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.atkCd = Math.max(0, this.atkCd - dt);
    if (this.stun > 0) { this.stun -= dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.86; this.vy *= 0.86; return; }

    const px = player.cx, py = player.feetY;
    const dx = px - this.cx, dy = py - this.cy;
    const d = Math.hypot(dx, dy) || 1;
    const def = this.def;
    let mvx = 0, mvy = 0;
    if (d < 120) {
      // chase
      mvx = (dx / d) * def.speed;
      mvy = (dy / d) * def.speed;
      if (def.erratic) { mvx += Math.cos(this.bob * 1.7) * def.speed * 0.6; mvy += Math.sin(this.bob * 2.1) * def.speed * 0.6; }
      this.dir = dx < 0 ? -1 : 1;
    } else {
      // wander
      this.wanderT -= dt;
      if (this.wanderT <= 0) { this.wanderT = this.rng.range(0.8, 2); const a = this.rng.angle(); this.wx = Math.cos(a); this.wy = Math.sin(a); }
      mvx = this.wx * def.speed * 0.4; mvy = this.wy * def.speed * 0.4;
    }
    this._move(mvx * dt, mvy * dt, area, def.flying);
  }

  _move(vx, vy, area, flying) {
    const collide = (nx, ny) => {
      if (flying) {
        // only walls (objects with wall flag) block fliers, plus bounds
        const tx = Math.floor((nx + this.w / 2) / TILE), ty = Math.floor((ny + this.h) / TILE);
        const o = area.solidObjectAt(tx, ty);
        return (o && o.wall) || nx < TILE || ny < TILE || nx > area.pxW - TILE || ny > area.pxH - TILE;
      }
      return area.rectCollides(nx, ny + this.h - 6, this.w, 6);
    };
    if (!collide(this.x + vx, this.y)) this.x += vx; else this.vx = 0;
    if (!collide(this.x, this.y + vy)) this.y += vy; else this.vy = 0;
  }

  hit(dmg, fromX, fromY) {
    if (this.dead) return false;
    this.hp -= dmg;
    this.hurtT = 0.18;
    const dx = this.cx - fromX, dy = this.cy - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * 180; this.vy = (dy / len) * 180;
    this.stun = 0.22;
    if (this.hp <= 0) { this.dead = true; return 'dead'; }
    return true;
  }

  // returns true if it should damage the player this frame
  touching(player) {
    if (this.dead || this.atkCd > 0) return false;
    const b = player.collideBox();
    if (this.x < b.x + b.w && this.x + this.w > b.x && this.y < b.y + b.h && this.y + this.h > b.y) {
      this.atkCd = 0.7;
      return true;
    }
    return false;
  }
}
