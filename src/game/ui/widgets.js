// Shared UI drawing helpers: panels, buttons, bars, item slots, tooltips.
import { Assets } from '../assets.js';
import { ITEMS } from '../data/items.js';

export const UI = {
  // 9-slice-ish rounded panel
  panel(r, x, y, w, h, { fill = '#2b2118', border = '#caa15e', accent = '#6b4a2a', alpha = 1 } = {}) {
    const ctx = r.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 2, y + 3, w, h);            // drop shadow
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = '#1a130c';
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    ctx.globalAlpha = 1;
  },

  bar(r, x, y, w, h, frac, color, { bg = '#1a130c', border = '#000' } = {}) {
    const ctx = r.ctx;
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0, Math.round(w * Math.max(0, Math.min(1, frac)))), h);
    ctx.strokeStyle = border; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  },

  button(r, x, y, w, h, label, hover, { active = false } = {}) {
    this.panel(r, x, y, w, h, { fill: active ? '#4a6b2f' : hover ? '#3a2c1e' : '#2b2118', border: hover ? '#e8d8a0' : '#caa15e' });
    r.text(label, x + w / 2, y + h / 2 - 3, { align: 'center', color: hover ? '#fff' : '#e8d8b0', size: 8 });
  },

  // Inventory slot with item icon + count + optional quality star
  slot(r, x, y, item, { selected = false, size = 18, quality = 0 } = {}) {
    const ctx = r.ctx;
    ctx.fillStyle = selected ? '#5a7a3a' : '#1f1810';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = selected ? '#e8d8a0' : '#6b4a2a';
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    if (item) {
      const icon = Assets.icon(item.id);
      if (icon) r.spriteScreen(icon, x + (size - 16) / 2, y + (size - 16) / 2);
      if (item.count > 1) r.text(String(item.count), x + size - 1, y + size - 8, { align: 'right', size: 8, color: '#fff' });
      if (quality === 1) r.text('✦', x + 1, y, { size: 7, color: '#cfe0ff' });
      if (quality === 2) r.text('✦', x + 1, y, { size: 7, color: '#ffe46b' });
    }
  },

  tooltip(r, x, y, item) {
    if (!item) return;
    const def = ITEMS[item.id];
    if (!def) return;
    const name = def.name;
    const lines = [name];
    if (def.desc) lines.push(def.desc);
    if (def.sellPrice) lines.push(`Sells: ${def.sellPrice}g`);
    if (def.edible) lines.push(`Eat: +${def.edible.energy || 0} energy`);
    const w = Math.max(...lines.map((l) => r.textWidth(l, 8))) + 12;
    const h = lines.length * 11 + 8;
    let px = x, py = y - h - 4;
    if (px + w > r.W) px = r.W - w - 2;
    if (py < 2) py = y + 16;
    this.panel(r, px, py, w, h);
    lines.forEach((l, i) => r.text(l, px + 6, py + 5 + i * 11, { size: 8, color: i === 0 ? '#ffe46b' : '#d8c8a8' }));
  },

  centerText(r, str, y, opts = {}) { r.text(str, r.W / 2, y, { align: 'center', ...opts }); },
};

// Item count helper for grids
export function gridLayout(cols, rows, cell, gap, ox, oy) {
  const cells = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      cells.push({ x: ox + col * (cell + gap), y: oy + row * (cell + gap), i: row * cols + col });
  return cells;
}
