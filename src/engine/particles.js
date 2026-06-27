// Lightweight particle system for polish: dust, leaves, sparkles, hits, weather.

export class Particles {
  constructor() { this.list = []; }
  clear() { this.list.length = 0; }

  spawn(opts) {
    this.list.push({
      x: opts.x, y: opts.y,
      vx: opts.vx || 0, vy: opts.vy || 0,
      ax: opts.ax || 0, ay: opts.ay || 0,
      life: opts.life || 0.5, max: opts.life || 0.5,
      size: opts.size || 2, color: opts.color || '#fff',
      grav: opts.grav || 0, drag: opts.drag ?? 1,
      shrink: opts.shrink ?? true, glow: opts.glow || false,
      shape: opts.shape || 'rect', spin: opts.spin || 0, rot: 0,
      fade: opts.fade ?? true, z: opts.z || 0,
    });
  }

  burst(x, y, n, base) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (base.speed || 30) * (0.4 + Math.random() * 0.6);
      this.spawn({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (base.up || 0),
        life: (base.life || 0.5) * (0.6 + Math.random() * 0.6),
        size: base.size || 2, color: Array.isArray(base.color) ? base.color[(Math.random() * base.color.length) | 0] : base.color,
        grav: base.grav ?? 80, drag: base.drag ?? 0.92, shape: base.shape || 'rect',
        spin: base.spin || 0, glow: base.glow,
      });
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy += (p.grav + p.ay) * dt;
      p.vx += p.ax * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  }

  draw(r) {
    const ctx = r.ctx;
    for (const p of this.list) {
      const a = p.fade ? Math.max(0, p.life / p.max) : 1;
      const s = p.shrink ? p.size * (p.life / p.max) : p.size;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const sx = r.sx(p.x), sy = r.sy(p.y);
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.5, s), 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === 'leaf') {
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot);
        ctx.fillRect(-s, -s / 2, s * 2, s); ctx.restore();
      } else {
        ctx.fillRect(sx - s / 2, sy - s / 2, Math.max(1, s), Math.max(1, s));
      }
    }
    ctx.globalAlpha = 1;
  }
}
