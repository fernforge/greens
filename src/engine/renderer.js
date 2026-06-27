// Renderer: wraps the canvas2d context with a camera, pixel-perfect helpers,
// a y-sortable draw queue, and lightweight text rendering.

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;        // top-left world coords of the view
    this.tx = 0; this.ty = 0;      // target (follow)
    this.shakeT = 0; this.shakeMag = 0;
    this.zoom = 1;
    this.ox = 0; this.oy = 0;      // shake offset
  }
  follow(wx, wy, viewW, viewH, worldW, worldH, snap = false) {
    this.tx = wx - viewW / 2;
    this.ty = wy - viewH / 2;
    // Clamp to world bounds (if world smaller than view, center it).
    if (worldW <= viewW) this.tx = (worldW - viewW) / 2;
    else this.tx = Math.max(0, Math.min(this.tx, worldW - viewW));
    if (worldH <= viewH) this.ty = (worldH - viewH) / 2;
    else this.ty = Math.max(0, Math.min(this.ty, worldH - viewH));
    const k = snap ? 1 : 0.16;
    this.x += (this.tx - this.x) * k;
    this.y += (this.ty - this.y) * k;
  }
  shake(mag, dur) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, dur); }
  update(dt, rng) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const m = this.shakeMag * (this.shakeT > 0 ? 1 : 0);
      this.ox = (Math.random() * 2 - 1) * m;
      this.oy = (Math.random() * 2 - 1) * m;
      if (this.shakeT <= 0) { this.ox = 0; this.oy = 0; this.shakeMag = 0; }
    }
  }
  get rx() { return Math.round(this.x + this.ox); }
  get ry() { return Math.round(this.y + this.oy); }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.W = canvas.width;
    this.H = canvas.height;
    this.cam = new Camera();
    this._queue = []; // y-sorted sprites for this frame
  }

  resize(w, h) {
    this.canvas.width = w; this.canvas.height = h;
    this.W = w; this.H = h;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(color = '#0a0d07') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.W, this.H);
  }

  // World -> screen
  sx(wx) { return Math.round(wx - this.cam.rx); }
  sy(wy) { return Math.round(wy - this.cam.ry); }
  // Screen -> world
  wx(sx) { return sx + this.cam.rx; }
  wy(sy) { return sy + this.cam.ry; }

  rect(wx, wy, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.sx(wx), this.sy(wy), w, h);
  }
  rectScreen(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, w, h);
  }
  strokeRectScreen(x, y, w, h, color, lw = 1) {
    this.ctx.strokeStyle = color; this.ctx.lineWidth = lw;
    this.ctx.strokeRect((x | 0) + 0.5, (y | 0) + 0.5, w - 1, h - 1);
  }

  // Draw a generated sprite (canvas/image) at world pos with optional flip.
  sprite(img, wx, wy, { flip = false, alpha = 1, w, h } = {}) {
    const ctx = this.ctx;
    const dw = w || img.width, dh = h || img.height;
    const dx = this.sx(wx), dy = this.sy(wy);
    if (dx + dw < 0 || dy + dh < 0 || dx > this.W || dy > this.H) return;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  spriteScreen(img, x, y, { flip = false, alpha = 1, w, h } = {}) {
    const ctx = this.ctx;
    const dw = w || img.width, dh = h || img.height;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save(); ctx.translate((x | 0) + dw, y | 0); ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, dw, dh); ctx.restore();
    } else ctx.drawImage(img, x | 0, y | 0, dw, dh);
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  // Soft elliptical shadow under an entity for the 2.5D look.
  shadow(wx, wy, w, alpha = 0.28) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.sx(wx), this.sy(wy), w * 0.5, w * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- y-sorted draw queue (for entities/objects on the ground plane) ---
  push(sortY, fn) { this._queue.push({ y: sortY, fn }); }
  flush() {
    this._queue.sort((a, b) => a.y - b.y);
    for (const it of this._queue) it.fn(this);
    this._queue.length = 0;
  }

  // Bitmap-ish text (uses canvas font, snapped to pixels).
  text(str, x, y, { color = '#fff', size = 8, align = 'left', shadow = '#000', font = 'monospace', baseline = 'top' } = {}) {
    const ctx = this.ctx;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, (x | 0) + 1, (y | 0) + 1); }
    ctx.fillStyle = color;
    ctx.fillText(str, x | 0, y | 0);
  }
  textWidth(str, size = 8, font = 'monospace') {
    this.ctx.font = `${size}px ${font}`;
    return this.ctx.measureText(str).width;
  }

  // Full-screen tint overlay (day/night, weather).
  tint(color, alpha) {
    if (alpha <= 0) return;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.ctx.restore();
  }

  // Multiply-blend darkness with additive light circles for night lighting.
  lightPass(color, alpha, lights) {
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.W, this.H);
    // Punch out lights
    ctx.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const sx = this.sx(l.x), sy = this.sy(l.y);
      const i = l.i ?? 1;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, l.r);
      // soft, gentle falloff so light pools read as glow not flashlight
      g.addColorStop(0, `rgba(0,0,0,${i})`);
      g.addColorStop(0.45, `rgba(0,0,0,${i * 0.72})`);
      g.addColorStop(0.78, `rgba(0,0,0,${i * 0.28})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - l.r, sy - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }

  // Additive warm glow for light sources (torches, sun glints) — bloom-ish.
  bloom(lights) {
    if (!lights || !lights.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const sx = this.sx(l.x), sy = this.sy(l.y);
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, l.r);
      g.addColorStop(0, hexA(l.color || '#ffd27a', (l.i ?? 0.5)));
      g.addColorStop(1, hexA(l.color || '#ffd27a', 0));
      ctx.fillStyle = g;
      ctx.fillRect(sx - l.r, sy - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }

  // Soft dark edges for cinematic framing.
  vignette(strength = 0.35, color = '#000') {
    if (strength <= 0) return;
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.35, this.W / 2, this.H / 2, this.H * 0.78);
    g.addColorStop(0, hexA(color, 0));
    g.addColorStop(1, hexA(color, strength));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }

  // Whole-screen color grade using a soft-light-ish overlay.
  grade(color, alpha, mode = 'overlay') {
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }
}

function hexA(hex, a) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
