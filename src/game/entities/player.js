// Player entity: movement with collision, 4-direction animation, facing tile,
// and tool-swing animation state. Stats live in GameState.player; this wraps it.
import { TILE } from '../../engine/spritegen.js';
import { DIRS } from '../../engine/math.js';

export const PLAYER_W = 10;   // collision box (feet), centered in 16px sprite
export const PLAYER_H = 8;
const SPRITE_W = 16, SPRITE_H = 24;

export class Player {
  constructor(gs) {
    this.gs = gs;
    this.p = gs.player;
    this.animT = 0;
    this.frame = 0;
    this.moving = false;
    this.swingT = 0;        // tool swing timer (animation)
    this.swingDur = 0;
    this.stepT = 0;
    this.faceDir = this.p.dir || 'down';
    this.flashT = 0;        // damage flash
    this.iframe = 0;        // invulnerability after hit
    this.knock = { x: 0, y: 0 };
  }

  get x() { return this.p.x; }
  get y() { return this.p.y; }
  set x(v) { this.p.x = v; }
  set y(v) { this.p.y = v; }

  // Center pixel and feet anchor
  get cx() { return this.p.x + SPRITE_W / 2; }
  get feetY() { return this.p.y + SPRITE_H - 2; }
  get tileX() { return Math.floor(this.cx / TILE); }
  get tileY() { return Math.floor(this.feetY / TILE); }

  // The tile the player is facing (for tool/interact targeting).
  facingTile() {
    const d = DIRS[this.faceDir];
    return { tx: this.tileX + d.x, ty: this.tileY + d.y };
  }

  collideBox() { return { x: this.p.x + (SPRITE_W - PLAYER_W) / 2, y: this.p.y + SPRITE_H - PLAYER_H - 1, w: PLAYER_W, h: PLAYER_H }; }

  canMove() { return this.swingT <= 0 && this.iframe < 0.0; }

  update(dt, input, area, busy) {
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.iframe > 0) this.iframe -= dt;
    if (this.swingT > 0) {
      this.swingT -= dt;
      this.moving = false;
      return;
    }
    // knockback decays
    if (Math.abs(this.knock.x) > 1 || Math.abs(this.knock.y) > 1) {
      this._tryMove(this.knock.x * dt, this.knock.y * dt, area);
      this.knock.x *= 0.85; this.knock.y *= 0.85;
    }

    if (busy) { this.moving = false; return; }

    const ax = input.axis();
    let dx = ax.x, dy = ax.y;
    const running = input.held('run');
    const baseSpeed = 62 * (running ? 1.6 : 1) * (this.gs.player.energy <= 0 ? 0.5 : 1);
    if (dx !== 0 || dy !== 0) {
      // set facing (prefer vertical when diagonal toward last input? use dominant)
      if (dx !== 0 && dy !== 0) {
        // keep current axis bias: face horizontal
        this.faceDir = dx > 0 ? 'right' : 'left';
      } else if (dx !== 0) this.faceDir = dx > 0 ? 'right' : 'left';
      else this.faceDir = dy > 0 ? 'down' : 'up';
      const len = Math.hypot(dx, dy) || 1;
      const vx = (dx / len) * baseSpeed * dt;
      const vy = (dy / len) * baseSpeed * dt;
      this._tryMove(vx, vy, area);
      this.moving = true;
      this.p.dir = this.faceDir;
      // footstep timing
      this.stepT -= dt;
      if (this.stepT <= 0) { this.stepT = running ? 0.22 : 0.32; this._stepped = true; }
    } else {
      this.moving = false;
    }

    // animation
    if (this.moving) {
      this.animT += dt * (running ? 12 : 8);
      this.frame = Math.floor(this.animT) % 4;
    } else {
      this.animT = 0; this.frame = 0;
    }
  }

  consumeStep() { if (this._stepped) { this._stepped = false; return true; } return false; }

  _tryMove(vx, vy, area) {
    const b = this.collideBox();
    // X axis
    if (vx !== 0) {
      const nx = b.x + vx;
      if (!area.rectCollides(nx, b.y, b.w, b.h)) this.p.x += vx;
      else {
        // step to contact
        const step = Math.sign(vx);
        while (!area.rectCollides(this.collideBox().x + step, this.collideBox().y, b.w, b.h) && Math.abs(step) < Math.abs(vx)) {
          this.p.x += step;
        }
      }
    }
    const b2 = this.collideBox();
    if (vy !== 0) {
      const ny = b2.y + vy;
      if (!area.rectCollides(b2.x, ny, b2.w, b2.h)) this.p.y += vy;
      else {
        const step = Math.sign(vy);
        while (!area.rectCollides(this.collideBox().x, this.collideBox().y + step, b2.w, b2.h) && Math.abs(step) < Math.abs(vy)) {
          this.p.y += step;
        }
      }
    }
    // clamp to world
    this.p.x = Math.max(-2, Math.min(this.p.x, area.pxW - SPRITE_W + 2));
    this.p.y = Math.max(-8, Math.min(this.p.y, area.pxH - SPRITE_H + 2));
  }

  swing(dur = 0.4) { this.swingT = dur; this.swingDur = dur; }
  isSwinging() { return this.swingT > 0; }

  hurt(dmg, fromX, fromY) {
    if (this.iframe > 0) return false;
    this.gs.player.health = Math.max(0, this.gs.player.health - dmg);
    this.flashT = 0.4; this.iframe = 0.8;
    const dx = this.cx - fromX, dy = this.feetY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.knock.x = (dx / len) * 120; this.knock.y = (dy / len) * 120;
    return true;
  }

  // Current sprite frame canvas for drawing.
  sprite(assets) {
    const set = assets.player;
    if (this.swingT > 0) return set.action[this.faceDir];
    return set[this.faceDir][this.moving ? this.frame : 0];
  }
}
