// NPC conversation UI: a bottom dialogue box with the villager's line, heart
// meter, and Chat / Gift / Leave actions. Gifting opens an inventory picker.
import { UI, gridLayout } from './widgets.js';
import { Assets } from '../assets.js';
import { ITEMS } from '../data/items.js';

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.npc = null;
    this.line = '';
    this.sub = 'line';     // line | menu | gift | reaction
    this.options = ['Chat', 'Gift', 'Leave'];
    this.sel = 0;
    this.giftPage = 0;
    this.typeT = 0;
    this.reactionT = 0;
  }

  open(npc) {
    this.npc = npc;
    const gs = this.game.gs;
    const rel = gs.relationships[npc.id];
    if (!rel.met) { rel.met = true; this.game.quests.onMeet(npc.id); this.line = npc.def.intro; this.game.checkQuests(); }
    else this.line = this.pickLine(npc);
    if (!rel.talkedToday) { rel.talkedToday = true; rel.points = Math.min(2500, rel.points + 18); }
    this.sub = 'line'; this.sel = 0; this.typeT = 0;
  }

  pickLine(npc) {
    const gs = this.game.gs;
    if (gs.time.isRaining() && npc.def.rainy && Math.random() < 0.5) return npc.def.rainy[(Math.random() * npc.def.rainy.length) | 0];
    const hearts = gs.hearts(npc.id);
    const tiers = Object.keys(npc.def.chat).map(Number).filter((t) => t <= hearts).sort((a, b) => b - a);
    const tier = tiers[0] ?? 0;
    const arr = npc.def.chat[tier] || npc.def.chat[0];
    return arr[(Math.random() * arr.length) | 0];
  }

  showGiftReaction(npc, reaction) {
    this.line = reaction.line;
    this.sub = 'reaction';
    this.reactionT = 0;
    this.reactionType = reaction.react;
  }

  update(dt) {
    const input = this.game.input;
    this.typeT += dt;
    if (this.sub === 'line') {
      if (this.pressed()) { this.sub = 'menu'; this.game.audio.sfx('select'); }
    } else if (this.sub === 'menu') {
      if (input.justPressed('up')) { this.sel = (this.sel + 2) % 3; this.game.audio.sfx('select'); }
      if (input.justPressed('down')) { this.sel = (this.sel + 1) % 3; this.game.audio.sfx('select'); }
      // mouse hover/click handled in render via click detection
      this.handleMenuMouse();
      if (input.justPressed('confirm') || input.justPressed('use')) this.choose(this.sel);
      if (input.justPressed('menu') || input.justPressed('interact')) this.close();
    } else if (this.sub === 'gift') {
      this.handleGiftMouse();
      if (input.justPressed('menu') || input.justPressed('interact')) { this.sub = 'menu'; }
    } else if (this.sub === 'reaction') {
      this.reactionT += dt;
      if (this.reactionT > 0.4 && this.pressed()) this.close();
    }
  }

  pressed() { const i = this.game.input; return i.justPressed('confirm') || i.justPressed('use') || i.justPressed('interact') || i.mouse.pressed; }

  choose(i) {
    if (i === 0) { this.line = this.pickLine(this.npc); this.sub = 'line'; this.typeT = 0; this.game.audio.sfx('select'); }
    else if (i === 1) { this.sub = 'gift'; this.game.audio.sfx('open'); }
    else this.close();
  }

  close() { this.game.mode = 'play'; this.npc = null; this.game.audio.sfx('close'); this.game.menuCooldown = 0.15; }

  // --- mouse helpers ---
  menuRects() {
    const r = this.game.r;
    const bw = 56, bh = 16, gap = 6;
    const totalW = 3 * bw + 2 * gap;
    const x0 = (r.W - totalW) / 2, y = r.H - 30;
    return this.options.map((o, i) => ({ x: x0 + i * (bw + gap), y, w: bw, h: bh, o, i }));
  }
  handleMenuMouse() {
    const m = this.game.input.mouse;
    for (const rect of this.menuRects()) {
      if (m.x >= rect.x && m.x < rect.x + rect.w && m.y >= rect.y && m.y < rect.y + rect.h) {
        this.sel = rect.i;
        if (m.pressed) this.choose(rect.i);
      }
    }
  }
  giftCells() {
    const r = this.game.r;
    return gridLayout(8, 3, 20, 2, (r.W - (8 * 22)) / 2, 60).map((c) => ({ ...c, slot: this.game.gs.inv.slots[c.i] }));
  }
  handleGiftMouse() {
    const m = this.game.input.mouse;
    if (!m.pressed) return;
    for (const c of this.giftCells()) {
      if (c.slot && m.x >= c.x && m.x < c.x + 18 && m.y >= c.y && m.y < c.y + 18) {
        this.game.giveGift(this.npc, c.i);
        return;
      }
    }
  }

  render() {
    const r = this.game.r, gs = this.game.gs;
    if (!this.npc) return;
    const npc = this.npc;
    // dim
    r.tint('#000', 0.18);

    if (this.sub === 'gift') {
      UI.panel(r, (r.W - 8 * 22) / 2 - 8, 40, 8 * 22 + 12, 90);
      r.text(`Give ${npc.def.name} a gift:`, r.W / 2, 46, { align: 'center', size: 8, color: '#e8d8a8' });
      const m = this.game.input.mouse;
      let hover = null;
      for (const c of this.giftCells()) {
        const isHover = c.slot && m.x >= c.x && m.x < c.x + 18 && m.y >= c.y && m.y < c.y + 18;
        UI.slot(r, c.x, c.y, c.slot, { selected: isHover, size: 18 });
        if (isHover) hover = c.slot;
      }
      r.text('Click an item to give · Esc to back', r.W / 2, 124, { align: 'center', size: 7, color: '#9cb0a0' });
      if (hover) UI.tooltip(r, m.x, m.y, hover);
      return;
    }

    // dialogue box
    const bx = 8, by = r.H - 70, bw = r.W - 16, bh = 44;
    UI.panel(r, bx, by, bw, bh);
    // portrait
    const frames = Assets.npcs[npc.id];
    const port = frames.down[0];
    r.ctx.save();
    r.rectScreen(bx + 4, by + 4, 26, 36, '#1f1810');
    r.spriteScreen(port, bx + 9, by + 10, { w: 16, h: 24 });
    r.ctx.restore();
    // name + hearts
    r.text(npc.def.name, bx + 36, by + 5, { size: 9, color: '#ffe46b' });
    r.text(npc.def.title, bx + 36 + r.textWidth(npc.def.name, 9) + 8, by + 6, { size: 7, color: '#9cb0a0' });
    const hearts = gs.hearts(npc.id);
    for (let i = 0; i < 10; i++) r.text('♥', bx + 36 + i * 9, by + 16, { size: 8, color: i < hearts ? '#e25f7a' : '#4a3a3a' });

    // line (typewriter)
    const shown = Math.floor(this.typeT * 48);
    const text = this.sub === 'line' || this.sub === 'reaction' ? this.line.slice(0, shown) : this.line;
    this.wrapText(r, text, bx + 36, by + 24, bw - 44, 9, '#fff');

    if (this.sub === 'menu') {
      for (const rect of this.menuRects()) UI.button(r, rect.x, rect.y, rect.w, rect.h, rect.o, this.sel === rect.i);
    } else if (this.sub === 'line') {
      r.text('▼', bx + bw - 12, by + bh - 12, { size: 8, color: '#aede6a' });
    } else if (this.sub === 'reaction') {
      r.text('▼', bx + bw - 12, by + bh - 12, { size: 8, color: '#aede6a' });
    }
  }

  wrapText(r, text, x, y, maxW, size, color) {
    const words = text.split(' ');
    let line = '', yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (r.textWidth(test, size) > maxW) { r.text(line, x, yy, { size, color }); line = w; yy += size + 3; }
      else line = test;
    }
    if (line) r.text(line, x, yy, { size, color });
  }
}
