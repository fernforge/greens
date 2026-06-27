// Shop UI: Buy seeds & supplies, or Sell from your pack. Mouse-driven with
// keyboard fallbacks. Buy 1 (click) or 5 (hold Shift).
import { UI } from './widgets.js';
import { Assets } from '../assets.js';
import { ITEMS } from '../data/items.js';
import { CROPS } from '../data/crops.js';

export class Shop {
  constructor(game) {
    this.game = game;
    this.tab = 'buy';
    this.scroll = 0;
    this.kind = 'general';
  }

  open(kind) {
    this.kind = kind; this.tab = 'buy'; this.scroll = 0;
    this.stock = this.buildStock();
  }

  buildStock() {
    const gs = this.game.gs;
    const season = gs.time.season;
    const list = [];
    // seeds for current season first, then other seeds (greyed but buyable)
    const seeds = CROPS.filter((c) => c.seedPrice > 0).map((c) => ({ id: c.id + '_seed', inSeason: c.season.includes(season) }));
    seeds.sort((a, b) => (b.inSeason - a.inSeason) || (ITEMS[a.id].price - ITEMS[b.id].price));
    for (const s of seeds) list.push({ id: s.id, price: ITEMS[s.id].price, off: !s.inSeason });
    // supplies
    for (const id of ['fertilizer', 'torch', 'fence', 'gate', 'recall_charm']) list.push({ id, price: this.supplyPrice(id) });
    return list;
  }
  supplyPrice(id) { return { fertilizer: 50, torch: 30, fence: 12, gate: 40, recall_charm: 600 }[id] || ITEMS[id]?.price || 50; }

  update(dt) {
    const i = this.game.input;
    if (i.justPressed('menu') || i.justPressed('interact')) return this.close();
    if (i.justPressed('prevTool') || i.justPressed('nextTool')) { this.tab = this.tab === 'buy' ? 'sell' : 'buy'; this.scroll = 0; this.game.audio.sfx('select'); }
    if (i.mouse.wheel) this.scroll = Math.max(0, this.scroll + i.mouse.wheel);
    this.handleMouse();
  }
  close() { this.game.mode = 'play'; this.game.audio.sfx('close'); this.game.menuCooldown = 0.15; }

  layout() {
    const r = this.game.r;
    const w = 280, h = 180, x = (r.W - w) / 2, y = (r.H - h) / 2;
    return { x, y, w, h, rowH: 18, listY: y + 40, listX: x + 12, listW: w - 24, rows: 7 };
  }

  visibleItems() {
    if (this.tab === 'buy') return this.stock;
    // sell: non-tool inventory items
    const seen = [];
    this.game.gs.inv.slots.forEach((s, idx) => { if (s && ITEMS[s.id] && ITEMS[s.id].type !== 'tool') seen.push({ idx, ...s }); });
    return seen;
  }

  handleMouse() {
    const m = this.game.input.mouse;
    const L = this.layout();
    // tab buttons
    const tabs = [{ t: 'buy', x: L.x + 12 }, { t: 'sell', x: L.x + 70 }];
    for (const tb of tabs) {
      if (this.hit(tb.x, L.y + 20, 52, 14)) { if (m.pressed) { this.tab = tb.t; this.scroll = 0; this.game.audio.sfx('select'); } }
    }
    // close button
    if (this.hit(L.x + L.w - 18, L.y + 6, 12, 12) && m.pressed) return this.close();
    // rows
    const items = this.visibleItems();
    for (let r = 0; r < L.rows; r++) {
      const idx = this.scroll + r;
      if (idx >= items.length) break;
      const ry = L.listY + r * L.rowH;
      if (this.hit(L.listX, ry, L.listW, L.rowH - 1) && m.pressed) {
        if (this.tab === 'buy') this.buy(items[idx]);
        else this.sell(items[idx]);
      }
    }
  }
  hit(x, y, w, h) { const m = this.game.input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }

  buy(entry) {
    const gs = this.game.gs;
    const qty = this.game.input.held('run') ? 5 : 1;
    const cost = entry.price * qty;
    if (gs.player.gold < entry.price) { this.game.audio.sfx('error'); this.game.toast('Not enough gold.', '#e85f5f'); return; }
    const actualQty = Math.min(qty, Math.floor(gs.player.gold / entry.price));
    if (!gs.inv.canFit(entry.id, actualQty)) { this.game.audio.sfx('error'); this.game.toast('Pack is full.', '#e85f5f'); return; }
    gs.player.gold -= entry.price * actualQty;
    gs.inv.add(entry.id, actualQty);
    this.game.audio.sfx('coin');
    this.game.checkQuests();
  }
  sell(entry) {
    const gs = this.game.gs;
    const slot = gs.inv.slots[entry.idx];
    if (!slot) return;
    const qty = this.game.input.held('run') ? slot.count : 1;
    const price = (ITEMS[slot.id].sellPrice || 0) * qty;
    gs.inv.removeSlot(entry.idx, qty);
    gs.player.gold += price;
    gs.stats.goldEarned += price;
    this.game.audio.sfx('sell');
  }

  render() {
    const r = this.game.r, gs = this.game.gs;
    r.tint('#000', 0.35);
    const L = this.layout();
    UI.panel(r, L.x, L.y, L.w, L.h);
    r.text(this.kind === 'general' ? 'General Store' : 'Shop', L.x + L.w / 2, L.y + 7, { align: 'center', size: 10, color: '#ffe46b' });
    r.text(`${gs.player.gold}g`, L.x + L.w - 22, L.y + 7, { align: 'right', size: 8, color: '#ffe46b' });
    // close x
    r.text('✕', L.x + L.w - 12, L.y + 6, { size: 9, color: '#e88' });
    // tabs
    UI.button(r, L.x + 12, L.y + 20, 52, 14, 'Buy', false, { active: this.tab === 'buy' });
    UI.button(r, L.x + 70, L.y + 20, 52, 14, 'Sell', false, { active: this.tab === 'sell' });
    r.text(this.game.input.held('run') ? (this.tab === 'buy' ? 'x5' : 'sell all') : 'Shift = bulk', L.x + L.w - 60, L.y + 24, { size: 7, color: '#9cb0a0' });

    const items = this.visibleItems();
    const m = this.game.input.mouse;
    for (let row = 0; row < L.rows; row++) {
      const idx = this.scroll + row;
      if (idx >= items.length) break;
      const it = items[idx];
      const ry = L.listY + row * L.rowH;
      const hover = this.hit(L.listX, ry, L.listW, L.rowH - 1);
      r.rectScreen(L.listX, ry, L.listW, L.rowH - 1, hover ? '#3a2c1e' : '#1f1810');
      const def = ITEMS[it.id];
      const icon = Assets.icon(it.id);
      if (icon) r.spriteScreen(icon, L.listX + 1, ry + 1);
      const off = it.off;
      r.text(def.name + (off ? ' (off-season)' : ''), L.listX + 20, ry + 5, { size: 8, color: off ? '#8a7a5a' : '#fff' });
      if (this.tab === 'buy') {
        r.text(it.price + 'g', L.listX + L.listW - 4, ry + 5, { align: 'right', size: 8, color: gs.player.gold >= it.price ? '#ffe46b' : '#e85f5f' });
      } else {
        r.text(`x${it.count}  →  ${(def.sellPrice || 0)}g`, L.listX + L.listW - 4, ry + 5, { align: 'right', size: 8, color: '#ffe46b' });
      }
    }
    // scrollbar hint
    if (items.length > L.rows) r.text(`▲▼ ${this.scroll + 1}-${Math.min(items.length, this.scroll + L.rows)}/${items.length}`, L.x + L.w / 2, L.y + L.h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
    r.text('Tab/Q/R: switch · Esc: leave', L.x + L.w / 2, L.y + L.h - 22, { align: 'center', size: 7, color: '#9cb0a0' });
  }
}
