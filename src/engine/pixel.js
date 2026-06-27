// Tiny offscreen pixel-canvas drawing API for procedural sprite generation.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

export class Px {
  constructor(w, h) {
    this.canvas = makeCanvas(w, h);
    this.ctx = this.canvas.getContext('2d');
    this.w = w; this.h = h;
  }
  get el() { return this.canvas; }

  clear() { this.ctx.clearRect(0, 0, this.w, this.h); return this; }
  set(x, y, color) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, 1, 1);
    return this;
  }
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
    return this;
  }
  rectO(x, y, w, h, color) {
    this.rect(x, y, w, 1, color);
    this.rect(x, y + h - 1, w, 1, color);
    this.rect(x, y, 1, h, color);
    this.rect(x + w - 1, y, 1, h, color);
    return this;
  }
  hline(x, y, len, color) { this.rect(x, y, len, 1, color); return this; }
  vline(x, y, len, color) { this.rect(x, y, 1, len, color); return this; }
  line(x0, y0, x1, y1, color) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return this;
  }
  circle(cx, cy, r, color, fill = true) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        const on = fill ? d <= r * r : (d <= r * r && d > (r - 1) * (r - 1));
        if (on) this.set(cx + x, cy + y, color);
      }
    }
    return this;
  }
  ellipse(cx, cy, rx, ry, color) {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.set(cx + x, cy + y, color);
      }
    }
    return this;
  }
  // Mirror left half onto right half (symmetric sprites).
  mirrorX(seam) {
    const data = this.ctx.getImageData(0, 0, this.w, this.h);
    const mid = seam ?? Math.floor(this.w / 2);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < mid; x++) {
        const si = (y * this.w + x) * 4;
        const dx = this.w - 1 - x;
        const di = (y * this.w + dx) * 4;
        data.data[di] = data.data[si];
        data.data[di + 1] = data.data[si + 1];
        data.data[di + 2] = data.data[si + 2];
        data.data[di + 3] = data.data[si + 3];
      }
    }
    this.ctx.putImageData(data, 0, 0);
    return this;
  }
  // Add an outline of `color` around opaque pixels.
  outline(color = '#000') {
    const src = this.ctx.getImageData(0, 0, this.w, this.h);
    const out = this.ctx.createImageData(this.w, this.h);
    out.data.set(src.data);
    const opaque = (x, y) => x >= 0 && y >= 0 && x < this.w && y < this.h && src.data[(y * this.w + x) * 4 + 3] > 0;
    const col = hexToRgb(color);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 4;
        if (src.data[i + 3] === 0 &&
          (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) {
          out.data[i] = col.r; out.data[i + 1] = col.g; out.data[i + 2] = col.b; out.data[i + 3] = 255;
        }
      }
    }
    this.ctx.putImageData(out, 0, 0);
    return this;
  }
  // Composite another Px/canvas at offset.
  blit(other, dx, dy) {
    this.ctx.drawImage(other.el || other, dx | 0, dy | 0);
    return this;
  }
}

export function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
}

// Shade a hex color by amount (-1..1). Negative darkens, positive lightens.
export function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

// Mix two hex colors by t (0..1).
export function mix(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
}
