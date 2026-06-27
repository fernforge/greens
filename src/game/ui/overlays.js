// Full-screen overlay panels: inventory, journal/quests, skills, map, crafting/
// cooking, settings, pause, shipping bin, chest, and the sleep confirmation.
import { UI, gridLayout } from './widgets.js';
import { Assets } from '../assets.js';
import { ITEMS } from '../data/items.js';
import { RECIPES } from '../data/recipes.js';
import { QUESTS, QUEST_BY_ID } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { SKILL_IDS, SKILL_NAMES } from '../systems/skills.js';
import { SaveManager } from '../../engine/save.js';
import { CROPS } from '../data/crops.js';
import { FISH } from '../data/fish.js';

// Almanac collection sets.
const CROP_IDS = CROPS.map((c) => c.id);
const FISH_IDS = FISH.map((f) => f.id);
const FORAGE_IDS = Object.values(ITEMS).filter((i) => i.type === 'forage').map((i) => i.id);
const MINERAL_IDS = ['copper', 'iron', 'gold', 'coal', 'gem', 'crystal', 'clay'];
const DISH_IDS = RECIPES.filter((r) => r.type === 'cook').map((r) => r.out);

export class Overlays {
  constructor(game) {
    this.game = game;
    this.name = null;
    this.opts = {};
    this.held = null;        // {id,count} cursor item
    this.craftTab = 'cook';
    this.pauseSel = 0;
    this.journalTab = 'quests';
    this.settings = SaveManager.loadSettings();
    this.breedA = null; this.breedB = null; this.lastStrain = null; this.codeMsg = '';
  }

  open(name, opts = {}) {
    this.name = name; this.opts = opts;
    if (name === 'crafting') this.craftTab = opts.tab || 'cook';
    if (name === 'breeding') { this.breedA = null; this.breedB = null; this.codeMsg = ''; this.scroll = 0; }
    this.game.menuCooldown = 0.18;
  }
  close() { if (this.held) { this.game.gs.inv.add(this.held.id, this.held.count); this.held = null; } this.game.closeOverlay(); }

  update(dt) {
    const i = this.game.input;
    if (this.game.menuCooldown > 0) return;
    if (this.name !== 'pause' && this.name !== 'sleepconfirm' && this.name !== 'sleeptransition') {
      if (i.justPressed('menu')) return this.close();
    }
    switch (this.name) {
      case 'inventory': this.updateGridScreen(); break;
      case 'chest': this.updateChest(); break;
      case 'shipping': this.updateShipping(); break;
      case 'crafting': this.updateCrafting(); break;
      case 'breeding': this.updateBreeding(); break;
      case 'journal': this.updateJournal(); break;
      case 'skills': if (i.justPressed('inventory') || i.justPressed('journal')) this.open('inventory'); break;
      case 'map': break;
      case 'pause': this.updatePause(); break;
      case 'sleepconfirm': this.updateSleepConfirm(); break;
    }
    // global quick-close keys
    if (i.justPressed('inventory') && this.name === 'inventory') this.close();
    if (i.justPressed('journal') && this.name === 'journal') this.close();
    if (i.justPressed('map') && this.name === 'map') this.close();
  }

  hit(x, y, w, h) { const m = this.game.input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }

  // ---------------- inventory ----------------
  invLayout() {
    const r = this.game.r;
    const cols = 12, rows = 3, cell = 20, gap = 2;
    const gw = cols * (cell + gap) - gap;
    const x = (r.W - gw) / 2, y = 60;
    return { cols, rows, cell, gap, x, y, gw };
  }
  updateGridScreen() {
    const L = this.invLayout();
    const m = this.game.input.mouse;
    if (!m.pressed) return;
    const inv = this.game.gs.inv;
    for (let idx = 0; idx < inv.size; idx++) {
      const col = idx % L.cols, row = (idx / L.cols) | 0;
      const x = L.x + col * (L.cell + L.gap), y = L.y + row * (L.cell + L.gap);
      if (this.hit(x, y, L.cell, L.cell)) { this.slotClick(inv, idx); return; }
    }
  }
  slotClick(inv, idx) {
    const slot = inv.slots[idx];
    if (this.held) {
      if (!slot) { inv.slots[idx] = this.held; this.held = null; }
      else if (slot.id === this.held.id) { const max = inv.stackMax(slot.id); const room = max - slot.count; const mv = Math.min(room, this.held.count); slot.count += mv; this.held.count -= mv; if (this.held.count <= 0) this.held = null; }
      else { inv.slots[idx] = this.held; this.held = slot; }
    } else if (slot) {
      // shift = eat if edible
      if (this.game.input.held('run') && ITEMS[slot.id]?.edible) { this.eatFromInv(inv, idx); return; }
      this.held = slot; inv.slots[idx] = null;
    }
    this.game.audio.sfx('select');
  }
  eatFromInv(inv, idx) {
    const slot = inv.slots[idx];
    const def = ITEMS[slot.id];
    if (!def.edible) return;
    const p = this.game.gs.player;
    p.energy = Math.min(p.maxEnergy, p.energy + (def.edible.energy || 0));
    p.health = Math.min(p.maxHealth, p.health + (def.edible.health || 0));
    inv.removeSlot(idx, 1);
    this.game.audio.sfx('eat');
  }

  // ---------------- chest ----------------
  updateChest() {
    const m = this.game.input.mouse;
    const chest = this.opts.chest;
    chest.items = chest.items || [];
    const L = this.invLayout();
    if (!m.pressed) return;
    // player inv (bottom)
    const inv = this.game.gs.inv;
    for (let idx = 0; idx < inv.size; idx++) {
      const col = idx % L.cols, row = (idx / L.cols) | 0;
      const x = L.x + col * (L.cell + L.gap), y = L.y + 80 + row * (L.cell + L.gap);
      if (this.hit(x, y, L.cell, L.cell)) {
        const s = inv.slots[idx];
        if (s) { this.depositToChest(chest, idx); }
        return;
      }
    }
    // chest grid (top)
    for (let idx = 0; idx < 24; idx++) {
      const col = idx % L.cols, row = (idx / L.cols) | 0;
      const x = L.x + col * (L.cell + L.gap), y = 30 + row * (L.cell + L.gap);
      if (this.hit(x, y, L.cell, L.cell)) {
        if (chest.items[idx]) { inv.add(chest.items[idx].id, chest.items[idx].count); chest.items[idx] = null; this.game.audio.sfx('select'); }
        return;
      }
    }
  }
  depositToChest(chest, invIdx) {
    const inv = this.game.gs.inv;
    const s = inv.slots[invIdx];
    chest.items = chest.items || [];
    // stack or find empty
    let placed = false;
    for (const c of chest.items) if (c && c.id === s.id) { c.count += s.count; placed = true; break; }
    if (!placed) { const e = chest.items.findIndex((x) => !x); if (e >= 0) chest.items[e] = { ...s }; else if (chest.items.length < 24) chest.items.push({ ...s }); else return; }
    inv.slots[invIdx] = null;
    this.game.audio.sfx('select');
  }

  // ---------------- shipping ----------------
  updateShipping() {
    const m = this.game.input.mouse;
    if (!m.pressed) return;
    const inv = this.game.gs.inv;
    const L = this.invLayout();
    for (let idx = 0; idx < inv.size; idx++) {
      const col = idx % L.cols, row = (idx / L.cols) | 0;
      const x = L.x + col * (L.cell + L.gap), y = L.y + 80 + row * (L.cell + L.gap);
      if (this.hit(x, y, L.cell, L.cell)) {
        const s = inv.slots[idx];
        if (s && ITEMS[s.id]?.type !== 'tool') this.game.shipItem(idx, this.game.input.held('run') ? s.count : 1);
        return;
      }
    }
  }

  // ---------------- crafting / cooking ----------------
  craftList() {
    return RECIPES.filter((r) => r.type === (this.craftTab === 'cook' ? 'cook' : 'craft'));
  }
  recipeKnown(rec) {
    if (!rec.unlock) return true;
    if (this.game.gs.recipesKnown.includes(rec.id)) return true;
    return this.game.gs.skills.level(rec.unlock.skill) >= rec.unlock.lvl;
  }
  canCraft(rec) { return Object.entries(rec.ingredients).every(([id, n]) => this.game.gs.inv.count(id) >= n); }
  updateCrafting() {
    const m = this.game.input.mouse;
    const r = this.game.r;
    const L = { x: (r.W - 300) / 2, y: 30, w: 300, h: 200 };
    // tabs
    if (this.hit(L.x + 12, L.y + 18, 60, 14) && m.pressed) { this.craftTab = 'cook'; this.scroll = 0; this.game.audio.sfx('select'); }
    if (this.hit(L.x + 78, L.y + 18, 60, 14) && m.pressed) { this.craftTab = 'craft'; this.scroll = 0; this.game.audio.sfx('select'); }
    if (this.game.input.mouse.wheel) this.scroll = Math.max(0, (this.scroll || 0) + this.game.input.mouse.wheel);
    const list = this.craftList();
    const rows = 8;
    for (let i = 0; i < rows; i++) {
      const idx = (this.scroll || 0) + i;
      if (idx >= list.length) break;
      const ry = L.y + 40 + i * 18;
      if (this.hit(L.x + 12, ry, L.w - 24, 17) && m.pressed) this.doCraft(list[idx]);
    }
  }
  doCraft(rec) {
    if (!this.recipeKnown(rec)) { this.game.audio.sfx('error'); this.game.toast('Recipe not learned yet.', '#e8b35f'); return; }
    if (!this.canCraft(rec)) { this.game.audio.sfx('error'); this.game.toast('Missing ingredients.', '#e85f5f'); return; }
    const inv = this.game.gs.inv;
    if (!inv.canFit(rec.out, rec.n)) { this.game.audio.sfx('error'); this.game.toast('Pack is full.', '#e85f5f'); return; }
    for (const [id, n] of Object.entries(rec.ingredients)) inv.remove(id, n);
    inv.add(rec.out, rec.n);
    if (rec.type === 'cook') { this.game.gs.stats.itemsCooked++; if (!this.game.gs.stats.cooked.includes(rec.out)) this.game.gs.stats.cooked.push(rec.out); }
    if (!this.game.gs.recipesKnown.includes(rec.id)) this.game.gs.recipesKnown.push(rec.id);
    this.game.audio.sfx(rec.type === 'cook' ? 'eat' : 'craft');
    this.game.grantXp(rec.type === 'cook' ? 'cooking' : 'mining', 6);
    this.game.checkQuests();
  }

  // ---------------- journal ----------------
  journalTabs() { return [['quests', 'Quests'], ['relations', 'Folk'], ['almanac', 'Almanac'], ['achievements', 'Awards'], ['stats', 'Stats']]; }
  updateJournal() {
    const m = this.game.input.mouse;
    const r = this.game.r;
    const L = { x: (r.W - 320) / 2, y: 24 };
    if (this.game.input.mouse.wheel) this.scroll = Math.max(0, (this.scroll || 0) + this.game.input.mouse.wheel);
    const tabs = this.journalTabs();
    const tw = 60;
    for (let i = 0; i < tabs.length; i++) {
      if (this.hit(L.x + 10 + i * (tw + 2), L.y + 14, tw, 14) && m.pressed) { this.journalTab = tabs[i][0]; this.scroll = 0; this.game.audio.sfx('select'); }
    }
  }

  // ---------------- pause ----------------
  pauseItems() {
    const s = this.game.settings;
    return ['Resume', 'Help / Controls', 'Inventory', 'Journal', 'Skills', 'Map',
      'Smart Tool: ' + (s.smartTool ? 'On' : 'Off'),
      this.settings.muteMusic ? 'Music: Off' : 'Music: On',
      this.settings.muteSfx ? 'Sound: Off' : 'Sound: On',
      'Save Game', 'Quit to Title'];
  }
  updatePause() {
    const i = this.game.input;
    const items = this.pauseItems();
    if (i.justPressed('up')) { this.pauseSel = (this.pauseSel + items.length - 1) % items.length; this.game.audio.sfx('select'); }
    if (i.justPressed('down')) { this.pauseSel = (this.pauseSel + 1) % items.length; this.game.audio.sfx('select'); }
    // mouse
    const r = this.game.r;
    const x = r.W / 2 - 70, y0 = 64;
    for (let k = 0; k < items.length; k++) {
      if (this.hit(x, y0 + k * 18, 140, 16)) { this.pauseSel = k; if (this.game.input.mouse.pressed) this.choosePause(k); }
    }
    if (i.justPressed('confirm') || i.justPressed('use')) this.choosePause(this.pauseSel);
    if (i.justPressed('menu')) this.close();
  }
  choosePause(k) {
    const label = this.pauseItems()[k];
    this.game.audio.sfx('confirm');
    switch (label) {
      case 'Resume': this.close(); break;
      case 'Help / Controls': this.open('help'); break;
      case 'Inventory': this.open('inventory'); break;
      case 'Journal': this.open('journal'); break;
      case 'Skills': this.open('skills'); break;
      case 'Map': this.open('map'); break;
      case 'Save Game': this.game.saveGame(this.game.gs._slot ?? 0); break;
      case 'Quit to Title': this.game.saveGame(this.game.gs._slot ?? 0); this.game.audio.stopMusic(); this.game.mode = 'title'; this.game.title.toSlots(); break;
      default:
        if (label.startsWith('Smart Tool')) { this.game.settings.smartTool = !this.game.settings.smartTool; SaveManager.saveSettings(this.game.settings); this.game.toast('Smart Tool ' + (this.game.settings.smartTool ? 'ON — Space auto-picks the right tool.' : 'OFF — use your equipped tool.'), '#9cd0ff'); }
        if (label.startsWith('Music')) { this.settings.muteMusic = !this.settings.muteMusic; this.game.audio.setMusicVol(this.settings.muteMusic ? 0 : 0.4); SaveManager.saveSettings(this.settings); }
        if (label.startsWith('Sound')) { this.settings.muteSfx = !this.settings.muteSfx; this.game.audio.setSfxVol(this.settings.muteSfx ? 0 : 0.6); SaveManager.saveSettings(this.settings); }
    }
  }

  // ---------------- sleep confirm ----------------
  updateSleepConfirm() {
    const i = this.game.input;
    if (i.justPressed('confirm') || i.justPressed('use')) { this.game.closeOverlay(); this.game.doSleep(false); }
    else if (i.justPressed('menu') || i.justPressed('interact')) this.close();
    const r = this.game.r;
    if (this.hit(r.W / 2 - 70, r.H / 2 + 6, 60, 18) && this.game.input.mouse.pressed) { this.game.closeOverlay(); this.game.doSleep(false); }
    if (this.hit(r.W / 2 + 10, r.H / 2 + 6, 60, 18) && this.game.input.mouse.pressed) this.close();
  }

  // ==================== RENDER ====================
  render() {
    const r = this.game.r;
    r.tint('#000', 0.45);
    switch (this.name) {
      case 'inventory': this.renderInventory(); break;
      case 'chest': this.renderChest(); break;
      case 'shipping': this.renderShipping(); break;
      case 'crafting': this.renderCrafting(); break;
      case 'breeding': this.renderBreeding(); break;
      case 'journal': this.renderJournal(); break;
      case 'skills': this.renderSkills(); break;
      case 'map': this.renderMap(); break;
      case 'pause': this.renderPause(); break;
      case 'help': this.renderHelp(); break;
      case 'sleepconfirm': this.renderSleepConfirm(); break;
    }
    // held cursor item
    if (this.held) {
      const m = this.game.input.mouse;
      const icon = Assets.icon(this.held.id);
      if (icon) r.spriteScreen(icon, m.x - 8, m.y - 8);
      if (this.held.count > 1) r.text(String(this.held.count), m.x + 8, m.y, { size: 8, color: '#fff' });
    }
  }

  drawGrid(srcSlots, count, x, y, L, hoverOut) {
    const r = this.game.r, m = this.game.input.mouse;
    for (let idx = 0; idx < count; idx++) {
      const col = idx % L.cols, row = (idx / L.cols) | 0;
      const sx = x + col * (L.cell + L.gap), sy = y + row * (L.cell + L.gap);
      const slot = srcSlots[idx];
      const hover = this.hit(sx, sy, L.cell, L.cell);
      UI.slot(r, sx, sy, slot, { selected: hover, size: L.cell });
      if (hover && slot && hoverOut) hoverOut.item = slot, hoverOut.x = m.x, hoverOut.y = m.y;
    }
  }

  renderInventory() {
    const r = this.game.r, gs = this.game.gs, L = this.invLayout();
    UI.panel(r, L.x - 10, 30, L.gw + 20, 110);
    r.text('Inventory', r.W / 2, 36, { align: 'center', size: 10, color: '#ffe46b' });
    r.text(`${gs.meta.playerName} · ${gs.player.gold}g`, r.W / 2, 48, { align: 'center', size: 7, color: '#9cb0a0' });
    const hov = {};
    this.drawGrid(gs.inv.slots, gs.inv.size, L.x, L.y, L, hov);
    r.text('Click to pick up/move · Shift+click edible to eat · I/Esc to close', r.W / 2, 130, { align: 'center', size: 7, color: '#9cb0a0' });
    if (hov.item && !this.held) UI.tooltip(r, hov.x, hov.y, hov.item);
  }

  renderChest() {
    const r = this.game.r, gs = this.game.gs, L = this.invLayout();
    const chest = this.opts.chest; chest.items = chest.items || [];
    UI.panel(r, L.x - 10, 24, L.gw + 20, 56);
    r.text('Chest', r.W / 2, 26, { align: 'center', size: 9, color: '#ffe46b' });
    const padded = []; for (let i = 0; i < 24; i++) padded[i] = chest.items[i] || null;
    const hov = {};
    this.drawGrid(padded, 24, L.x, 38, L, hov);
    UI.panel(r, L.x - 10, L.y + 70, L.gw + 20, 80);
    r.text('Your Pack', r.W / 2, L.y + 72, { align: 'center', size: 8, color: '#9cb0a0' });
    this.drawGrid(gs.inv.slots, gs.inv.size, L.x, L.y + 80, L, hov);
    r.text('Click to move items · Esc to close', r.W / 2, L.y + 70 + 76, { align: 'center', size: 7, color: '#9cb0a0' });
    if (hov.item) UI.tooltip(r, hov.x, hov.y, hov.item);
  }

  renderShipping() {
    const r = this.game.r, gs = this.game.gs, L = this.invLayout();
    UI.panel(r, L.x - 10, 24, L.gw + 20, 40);
    r.text('Shipping Bin', r.W / 2, 28, { align: 'center', size: 9, color: '#ffe46b' });
    let total = 0; for (const b of gs.shippingBin) total += (ITEMS[b.id]?.sellPrice || 0) * b.count;
    r.text(`In bin: ${gs.shippingBin.reduce((a, b) => a + b.count, 0)} items · sells for ${total}g at day's end`, r.W / 2, 42, { align: 'center', size: 7, color: '#cfe0c0' });
    UI.panel(r, L.x - 10, L.y, L.gw + 20, 80);
    r.text('Your Pack — click an item to ship (Shift = all)', r.W / 2, L.y + 2, { align: 'center', size: 7, color: '#9cb0a0' });
    const hov = {};
    this.drawGrid(gs.inv.slots, gs.inv.size, L.x, L.y + 12, L, hov);
    if (hov.item) UI.tooltip(r, hov.x, hov.y, hov.item);
  }

  renderCrafting() {
    const r = this.game.r, gs = this.game.gs;
    const L = { x: (r.W - 300) / 2, y: 30, w: 300, h: 200 };
    UI.panel(r, L.x, L.y, L.w, L.h);
    r.text(this.craftTab === 'cook' ? 'Kitchen' : 'Crafting', L.x + L.w / 2, L.y + 5, { align: 'center', size: 10, color: '#ffe46b' });
    UI.button(r, L.x + 12, L.y + 18, 60, 14, 'Cook', false, { active: this.craftTab === 'cook' });
    UI.button(r, L.x + 78, L.y + 18, 60, 14, 'Craft', false, { active: this.craftTab === 'craft' });
    const list = this.craftList();
    const m = this.game.input.mouse;
    let tip = null;
    for (let i = 0; i < 8; i++) {
      const idx = (this.scroll || 0) + i;
      if (idx >= list.length) break;
      const rec = list[idx];
      const ry = L.y + 40 + i * 18;
      const known = this.recipeKnown(rec);
      const can = known && this.canCraft(rec);
      const hover = this.hit(L.x + 12, ry, L.w - 24, 17);
      r.rectScreen(L.x + 12, ry, L.w - 24, 17, hover ? '#3a2c1e' : '#1f1810');
      const out = ITEMS[rec.out];
      const icon = Assets.icon(rec.out);
      r.ctx.globalAlpha = known ? 1 : 0.4;
      if (icon) r.spriteScreen(icon, L.x + 14, ry + 1);
      r.text(known ? out.name : '???', L.x + 34, ry + 1, { size: 8, color: can ? '#fff' : '#9a8a6a' });
      // ingredients
      const ing = Object.entries(rec.ingredients).map(([id, n]) => `${ITEMS[id].name.split(' ')[0]} x${n}(${gs.inv.count(id)})`).join('  ');
      r.text(known ? ing : `Unlock: ${SKILL_NAMES[rec.unlock.skill]} Lv${rec.unlock.lvl}`, L.x + 34, ry + 9, { size: 6, color: can ? '#aede6a' : '#c89a6a' });
      r.ctx.globalAlpha = 1;
      if (hover && known) tip = ITEMS[rec.out];
    }
    if (list.length > 8) r.text(`scroll · ${(this.scroll || 0) + 1}/${list.length}`, L.x + L.w / 2, L.y + L.h - 10, { align: 'center', size: 7, color: '#9cb0a0' });
    r.text('Click to make · Esc to close', L.x + L.w - 8, L.y + 6, { align: 'right', size: 6, color: '#9cb0a0' });
  }

  renderJournal() {
    const r = this.game.r, gs = this.game.gs;
    const L = { x: (r.W - 320) / 2, y: 24, w: 320, h: 218 };
    UI.panel(r, L.x, L.y, L.w, L.h);
    const tabs = this.journalTabs(); const tw = 60;
    for (let i = 0; i < tabs.length; i++) UI.button(r, L.x + 10 + i * (tw + 2), L.y + 14, tw, 14, tabs[i][1], false, { active: this.journalTab === tabs[i][0] });

    if (this.journalTab === 'almanac') { this.renderAlmanac(L); }
    else if (this.journalTab === 'achievements') { this.renderAchievements(L); }
    else if (this.journalTab === 'quests') {
      let y = L.y + 36;
      const active = gs.quests.active.map((id) => QUEST_BY_ID[id]).filter(Boolean);
      r.text('Active Quests', L.x + 14, y, { size: 8, color: '#aede6a' }); y += 13;
      if (!active.length) { r.text('No active quests. Talk to townsfolk!', L.x + 18, y, { size: 7, color: '#9cb0a0' }); y += 12; }
      for (const q of active) {
        const done = this.game.quests.isComplete(q);
        r.text((done ? '✔ ' : '• ') + q.title, L.x + 18, y, { size: 8, color: done ? '#aede6a' : '#fff' });
        r.text(this.game.quests.progressText(q), L.x + L.w - 16, y, { align: 'right', size: 7, color: done ? '#aede6a' : '#e8d8a8' });
        y += 10;
        this.game.r.text(q.desc, L.x + 24, y, { size: 6, color: '#9cb0a0' }); y += 12;
        if (y > L.y + L.h - 24) break;
      }
      r.text(`Completed: ${gs.quests.done.length}/${QUESTS.length}`, L.x + 14, L.y + L.h - 12, { size: 7, color: '#9cb0a0' });
    } else if (this.journalTab === 'relations') {
      let y = L.y + 38;
      for (const n of NPCS) {
        const rel = gs.relationships[n.id];
        const hearts = gs.hearts(n.id);
        const met = rel?.met;
        r.spriteScreen(Assets.npcs[n.id].down[0], L.x + 14, y - 4, { w: 12, h: 18 });
        r.text(met ? n.def?.name || n.name : '???', L.x + 30, y, { size: 8, color: met ? '#fff' : '#777' });
        r.text(met ? n.title : '', L.x + 30, y + 9, { size: 6, color: '#9cb0a0' });
        for (let h = 0; h < 10; h++) r.text('♥', L.x + 150 + h * 9, y + 2, { size: 7, color: h < hearts ? '#e25f7a' : '#4a3a3a' });
        y += 22;
        if (y > L.y + L.h - 16) break;
      }
    } else {
      let y = L.y + 40;
      const st = gs.stats;
      const rows = [
        ['Farm Name', gs.meta.farmName], ['Days Played', st.daysPlayed],
        ['Gold', gs.player.gold + 'g'], ['Lifetime Earnings', st.goldEarned + 'g'],
        ['Crops Harvested', st.cropsHarvested], ['Fish Species', st.fishCaught.length + '/16'],
        ['Forage Found', st.foraged.length], ['Monsters Slain', st.kills],
        ['Deepest Mine', 'Lv ' + st.deepestMine], ['Items Cooked', st.itemsCooked],
        ['Skill Total', gs.skills.total() + '/60'],
      ];
      for (const [k, v] of rows) { r.text(k, L.x + 18, y, { size: 8, color: '#cfe0c0' }); r.text(String(v), L.x + L.w - 18, y, { align: 'right', size: 8, color: '#ffe46b' }); y += 14; }
    }
    r.text('J/Esc to close', L.x + L.w - 8, L.y + 6, { align: 'right', size: 6, color: '#9cb0a0' });
  }

  // ---------------- breeding bench ----------------
  ownedSeeds() {
    const out = [];
    this.game.gs.inv.slots.forEach((s, idx) => { if (s && ITEMS[s.id] && ITEMS[s.id].type === 'seed') out.push({ ...s, idx }); });
    return out;
  }
  breedLayout() {
    const r = this.game.r;
    const w = 300, h = 210, x = (r.W - w) / 2, y = (r.H - h) / 2;
    return { x, y, w, h, gridX: x + 12, gridY: y + 96, cols: 12, cell: 18, gap: 2 };
  }
  updateBreeding() {
    const m = this.game.input.mouse;
    const L = this.breedLayout();
    if (this.game.input.mouse.wheel) this.scroll = Math.max(0, (this.scroll || 0) + this.game.input.mouse.wheel);
    if (!m.pressed) return;
    // parent slots: click to clear
    if (this.hit(L.x + 14, L.y + 24, 20, 20) && this.breedA) { this.breedA = null; this.game.audio.sfx('select'); return; }
    if (this.hit(L.x + 50, L.y + 24, 20, 20) && this.breedB) { this.breedB = null; this.game.audio.sfx('select'); return; }
    // buttons
    if (this.hit(L.x + L.w - 92, L.y + 24, 80, 18)) return this.doBreed();
    if (this.lastStrain && this.hit(L.x + L.w - 92, L.y + 46, 80, 14)) return this.copyCode();
    if (this.hit(L.x + L.w - 92, L.y + 62, 80, 14)) return this.importCode();
    // seed grid
    const seeds = this.ownedSeeds();
    const start = (this.scroll || 0) * L.cols;
    for (let i = 0; i < L.cols * 3; i++) {
      const seed = seeds[start + i];
      if (!seed) break;
      const col = i % L.cols, row = (i / L.cols) | 0;
      const sx = L.gridX + col * (L.cell + L.gap), sy = L.gridY + row * (L.cell + L.gap);
      if (this.hit(sx, sy, L.cell, L.cell)) { this.assignParent(seed.id); return; }
    }
  }
  assignParent(id) {
    if (!this.breedA) this.breedA = id;
    else if (!this.breedB) this.breedB = id;
    else this.breedA = id, this.breedB = null;
    this.game.audio.sfx('select');
  }
  doBreed() {
    if (!this.breedA || !this.breedB) { this.game.toast('Pick two seeds to cross.', '#e8b35f'); this.game.audio.sfx('error'); return; }
    const inv = this.game.gs.inv;
    if (!inv.has(this.breedA, 1) || !inv.has(this.breedB, 1) || (this.breedA === this.breedB && inv.count(this.breedA) < 2)) {
      this.game.toast('You need a seed of each parent.', '#e8b35f'); this.game.audio.sfx('error'); return;
    }
    const cross = this.game.genetics.cross(this.breedA, this.breedB);
    if (!cross) { this.game.audio.sfx('error'); return; }
    inv.remove(this.breedA, 1); inv.remove(this.breedB, 1);
    const strain = this.game.genetics.create(cross.base, cross.genes, 1);
    const seedId = 'st_seed_' + strain.id;
    inv.add(seedId, 2);
    this.lastStrain = strain;
    this.codeMsg = this.game.genetics.encode(strain);
    if (!this.game.gs.stats.strainsBred) this.game.gs.stats.strainsBred = 0;
    this.game.gs.stats.strainsBred++;
    this.game.gs.flags.everBred = true;
    this.game.audio.sfx('levelup');
    this.game.screenFlash('#9af0d0', 0.16);
    this.game.popups.push({ text: `🌱 New strain: ${strain.name}!`, t: 4, color: '#9af0d0' });
    this.breedA = seedId; this.breedB = null;   // chain-breed your new strain
    this.game.checkQuests && this.game.checkQuests();
  }
  copyCode() {
    if (!this.lastStrain) return;
    const code = this.game.genetics.encode(this.lastStrain);
    try { navigator.clipboard && navigator.clipboard.writeText(code); } catch {}
    this.codeMsg = 'Copied: ' + code;
    this.game.toast('Strain code copied — share it!', '#9cd0ff');
  }
  importCode() {
    const apply = (txt) => {
      const strain = this.game.genetics.importCode(txt);
      if (!strain) { this.game.toast('No valid strain code on clipboard.', '#e8b35f'); this.game.audio.sfx('error'); return; }
      this.game.gs.inv.add('st_seed_' + strain.id, 2);
      this.lastStrain = strain;
      this.game.audio.sfx('confirm');
      this.game.popups.push({ text: `📥 Imported: ${strain.name}!`, t: 4, color: '#9af0d0' });
    };
    try {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(apply).catch(() => this.game.toast('Allow clipboard access to import.', '#e8b35f'));
      else this.game.toast('Clipboard not available.', '#e8b35f');
    } catch { this.game.toast('Clipboard not available.', '#e8b35f'); }
  }

  renderBreeding() {
    const r = this.game.r, gs = this.game.gs, m = this.game.input.mouse;
    const L = this.breedLayout();
    UI.panel(r, L.x, L.y, L.w, L.h);
    r.text('Breeding Bench', L.x + L.w / 2, L.y + 6, { align: 'center', size: 11, color: '#9af0d0' });
    // parent slots
    UI.slot(r, L.x + 14, L.y + 24, this.breedA ? { id: this.breedA, count: 1 } : null, { selected: !!this.breedA, size: 20 });
    r.text('×', L.x + 38, L.y + 30, { size: 12, color: '#cfe0c0', shadow: null });
    UI.slot(r, L.x + 50, L.y + 24, this.breedB ? { id: this.breedB, count: 1 } : null, { selected: !!this.breedB, size: 20 });
    // offspring preview
    const prev = (this.breedA && this.breedB) ? this.game.genetics.previewCross(this.breedA, this.breedB) : null;
    if (prev) {
      const swatch = Assets.tintCanvas(Assets.icon(prev.base), prev.genes.hue);
      r.spriteScreen(swatch, L.x + 84, L.y + 22, { w: 22, h: 22 });
      r.text('→', L.x + 74, L.y + 30, { size: 10, color: '#9af0d0', shadow: null });
      r.text(prev.name + (prev.hybrid ? ' (hybrid)' : ''), L.x + 112, L.y + 22, { size: 8, color: '#fff' });
      const g = prev.genes;
      this.geneBar(L.x + 112, L.y + 33, 'Yield', g.yield / 4, '#7cc04f');
      this.geneBar(L.x + 112, L.y + 42, 'Speed', g.speed / 0.5, '#9cd0ff');
      this.geneBar(L.x + 112, L.y + 51, 'Value', (g.value - 1) / 2.2, '#ffe46b');
      this.geneBar(L.x + 112, L.y + 60, 'Hardy', g.hardiness, '#e8a0a0');
    } else {
      r.text('Click two seeds below to cross them.', L.x + 78, L.y + 30, { size: 8, color: '#9cb0a0' });
    }
    // buttons
    UI.button(r, L.x + L.w - 92, L.y + 24, 80, 18, 'Breed', this.hit(L.x + L.w - 92, L.y + 24, 80, 18), { active: !!(this.breedA && this.breedB) });
    if (this.lastStrain) UI.button(r, L.x + L.w - 92, L.y + 46, 80, 14, 'Copy Code', this.hit(L.x + L.w - 92, L.y + 46, 80, 14));
    UI.button(r, L.x + L.w - 92, L.y + 62, 80, 14, 'Import Code', this.hit(L.x + L.w - 92, L.y + 62, 80, 14));
    // seed grid
    r.text('Your seeds (click to pick parents):', L.x + 12, L.y + 86, { size: 7, color: '#9cb0a0' });
    const seeds = this.ownedSeeds();
    const start = (this.scroll || 0) * L.cols;
    let tip = null;
    for (let i = 0; i < L.cols * 3; i++) {
      const seed = seeds[start + i];
      if (!seed) break;
      const col = i % L.cols, row = (i / L.cols) | 0;
      const sx = L.gridX + col * (L.cell + L.gap), sy = L.gridY + row * (L.cell + L.gap);
      const hover = this.hit(sx, sy, L.cell, L.cell);
      const sel = seed.id === this.breedA || seed.id === this.breedB;
      UI.slot(r, sx, sy, seed, { selected: hover || sel, size: L.cell });
      if (hover) tip = seed;
    }
    // result / code line
    if (this.codeMsg) r.text(this.codeMsg, L.x + L.w / 2, L.y + L.h - 22, { align: 'center', size: 7, color: '#9cd0ff' });
    r.text(`Strains bred: ${gs.stats.strainsBred || 0}  ·  see them in Journal → Almanac`, L.x + L.w / 2, L.y + L.h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
    if (tip) UI.tooltip(r, m.x, m.y, tip);
  }
  geneBar(x, y, label, frac, color) {
    const r = this.game.r;
    r.text(label, x, y, { size: 6, color: '#cfe0c0' });
    UI.bar(r, x + 28, y, 60, 5, Math.max(0, Math.min(1, frac)), color);
  }

  // ---------------- almanac (collections) ----------------
  renderAlmanac(L) {
    const r = this.game.r, gs = this.game.gs, m = this.game.input.mouse;
    const strainIds = Object.values(gs.strains || {}).map((s) => 'st_crop_' + s.id);
    const sections = [
      { name: 'Crops', ids: CROP_IDS, seen: gs.stats.cropsSeen },
      { name: 'Strains (bred)', ids: strainIds, seen: strainIds },
      { name: 'Fish', ids: FISH_IDS, seen: gs.stats.fishCaught },
      { name: 'Forage', ids: FORAGE_IDS, seen: gs.stats.foraged },
      { name: 'Minerals', ids: MINERAL_IDS, seen: gs.stats.mineralsSeen },
      { name: 'Dishes', ids: DISH_IDS, seen: gs.stats.cooked },
    ];
    const cell = 17;
    let y = L.y + 34 - (this.scroll || 0) * 1;
    let tip = null;
    // scrollable flow
    const startY = L.y + 32;
    let yy = startY - (this.scroll || 0) * 18;
    r.ctx.save();
    for (const sec of sections) {
      if (yy > L.y + 30 && yy < L.y + L.h - 8) r.text(`${sec.name}  (${sec.seen.length}/${sec.ids.length})`, L.x + 14, yy, { size: 8, color: '#aede6a' });
      let cx = L.x + 14, cy = yy + 11;
      for (let i = 0; i < sec.ids.length; i++) {
        const id = sec.ids[i];
        const found = sec.seen.includes(id);
        if (cy > L.y + 26 && cy < L.y + L.h - 16) {
          const hover = m.x >= cx && m.x < cx + 16 && m.y >= cy && m.y < cy + 16;
          r.ctx.fillStyle = '#1f1810'; r.ctx.fillRect(cx, cy, 16, 16);
          if (found) { const icon = Assets.icon(id); if (icon) r.spriteScreen(icon, cx, cy); if (hover) tip = { id }; }
          else { r.text('?', cx + 8, cy + 4, { align: 'center', size: 8, color: '#5a5040', shadow: null }); }
          r.ctx.strokeStyle = found ? '#caa15e' : '#4a4030'; r.ctx.strokeRect(cx + 0.5, cy + 0.5, 15, 15);
        }
        cx += cell;
        if (cx > L.x + L.w - cell - 6) { cx = L.x + 14; cy += cell; }
      }
      yy = cy + cell + 6;
    }
    r.ctx.restore();
    const total = sections.reduce((a, s) => a + s.ids.length, 0);
    const got = sections.reduce((a, s) => a + Math.min(s.seen.length, s.ids.length), 0);
    r.text(`Discovered ${got}/${total}  ·  scroll for more`, L.x + L.w / 2, L.y + L.h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
    if (tip) UI.tooltip(r, m.x, m.y, { id: tip.id, count: 1 });
  }

  renderAchievements(L) {
    const r = this.game.r;
    const list = this.game.achievements.list();
    const rows = 7;
    const start = (this.scroll || 0);
    r.text(`Achievements  ${this.game.achievements.count()}/${list.length}`, L.x + 14, L.y + 32, { size: 8, color: '#aede6a' });
    let y = L.y + 44;
    for (let i = 0; i < rows; i++) {
      const a = list[start + i];
      if (!a) break;
      r.ctx.fillStyle = a.done ? '#26301c' : '#1f1810';
      r.ctx.fillRect(L.x + 12, y, L.w - 24, 22);
      r.ctx.strokeStyle = a.done ? a.color : '#3a3226'; r.ctx.strokeRect(L.x + 12.5, y + 0.5, L.w - 25, 21);
      r.text(a.done ? '🏆' : '🔒', L.x + 18, y + 6, { size: 10, color: a.done ? a.color : '#5a5040', shadow: null });
      r.text(a.name, L.x + 38, y + 4, { size: 8, color: a.done ? '#fff' : '#8a8268' });
      r.text(a.desc, L.x + 38, y + 13, { size: 6, color: a.done ? '#cfe0c0' : '#6a6450' });
      y += 24;
    }
    if (list.length > rows) r.text(`scroll · ${start + 1}-${Math.min(list.length, start + rows)}/${list.length}`, L.x + L.w / 2, L.y + L.h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
  }

  renderSkills() {
    const r = this.game.r, gs = this.game.gs;
    const L = { x: (r.W - 240) / 2, y: 40, w: 240, h: 160 };
    UI.panel(r, L.x, L.y, L.w, L.h);
    r.text('Skills', L.x + L.w / 2, L.y + 6, { align: 'center', size: 10, color: '#ffe46b' });
    let y = L.y + 26;
    for (const s of SKILL_IDS) {
      const lvl = gs.skills.level(s);
      r.text(SKILL_NAMES[s], L.x + 14, y, { size: 8, color: '#fff' });
      r.text('Lv ' + lvl, L.x + 90, y, { size: 8, color: '#aede6a' });
      UI.bar(r, L.x + 120, y, 100, 7, gs.skills.progress(s), '#7cc04f');
      y += 20;
    }
    r.text(`Total Level: ${gs.skills.total()}`, L.x + L.w / 2, L.y + L.h - 14, { align: 'center', size: 8, color: '#e8d8a8' });
  }

  renderMap() {
    const r = this.game.r, gs = this.game.gs;
    const L = { x: (r.W - 220) / 2, y: 30, w: 220, h: 180 };
    UI.panel(r, L.x, L.y, L.w, L.h);
    r.text('Hollowbrook Valley', L.x + L.w / 2, L.y + 6, { align: 'center', size: 10, color: '#ffe46b' });
    // simple schematic
    const nodes = {
      farm: { x: 110, y: 36, label: 'Farm', c: '#6cae44' },
      town: { x: 110, y: 84, label: 'Town', c: '#caa15e' },
      forest: { x: 48, y: 84, label: 'Forest', c: '#3f8a36' },
      beach: { x: 172, y: 84, label: 'Beach', c: '#e2cf94' },
      mine_entrance: { x: 110, y: 140, label: 'Mine', c: '#8b8790' },
    };
    const ox = L.x, oy = L.y;
    r.ctx.strokeStyle = '#6b5a3a'; r.ctx.lineWidth = 1;
    const link = (a, b) => { r.ctx.beginPath(); r.ctx.moveTo(ox + nodes[a].x, oy + nodes[a].y); r.ctx.lineTo(ox + nodes[b].x, oy + nodes[b].y); r.ctx.stroke(); };
    link('farm', 'town'); link('town', 'forest'); link('town', 'beach'); link('town', 'mine_entrance');
    const cur = gs.player.area.startsWith('mine_') ? 'mine_entrance' : gs.player.area === 'home' ? 'farm' : gs.player.area;
    for (const [id, n] of Object.entries(nodes)) {
      const x = ox + n.x, y = oy + n.y;
      r.rectScreen(x - 14, y - 8, 28, 16, n.c);
      r.strokeRectScreen(x - 14, y - 8, 28, 16, cur === id ? '#fff' : '#3a2a1c', cur === id ? 2 : 1);
      r.text(n.label, x, y - 3, { align: 'center', size: 7, color: '#1a130c', shadow: null });
    }
    if (cur && nodes[cur]) r.text('● You are here', ox + nodes[cur].x, oy + nodes[cur].y + 10, { align: 'center', size: 6, color: '#fff' });
    r.text('M/Esc to close', L.x + L.w / 2, L.y + L.h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
  }

  renderPause() {
    const r = this.game.r;
    const items = this.pauseItems();
    UI.panel(r, r.W / 2 - 84, 44, 168, items.length * 18 + 28);
    r.text('Paused', r.W / 2, 50, { align: 'center', size: 10, color: '#ffe46b' });
    const x = r.W / 2 - 70, y0 = 64;
    for (let k = 0; k < items.length; k++) UI.button(r, x, y0 + k * 18, 140, 16, items[k], this.pauseSel === k);
  }

  renderHelp() {
    const r = this.game.r;
    const w = 300, h = 210, x = (r.W - w) / 2, y = (r.H - h) / 2;
    UI.panel(r, x, y, w, h);
    r.text('How to Play', x + w / 2, y + 8, { align: 'center', size: 11, color: '#ffe46b' });
    const rows = [
      ['Move', 'WASD / Arrow keys  (hold Shift to run)'],
      ['Use / Act', 'Space or Left-click — uses the right tool'],
      ['', 'for whatever you face (Smart Tool)'],
      ['Interact', 'E or F — talk, harvest, gather, enter, sleep'],
      ['Hotbar', '1–0, Q/R, or mouse wheel to switch items'],
      ['Bag / Journal', 'I  /  J        Map: M        Menu: Esc'],
      ['', ''],
      ['Tools', 'Hoe tills · Watering Can waters · Axe chops trees'],
      ['', 'Pickaxe mines rocks · Scythe clears weeds'],
      ['', 'Sword fights · Rod fishes water'],
      ['Tip', 'The floating prompt shows the action & tool needed.'],
      ['Tip', 'Sleep in bed before 2 AM. Ship crops in the bin.'],
    ];
    let yy = y + 28;
    for (const [k, v] of rows) {
      if (k) r.text(k, x + 14, yy, { size: 8, color: '#9ad96a' });
      r.text(v, x + 96, yy, { size: 7, color: '#e8e0d0' });
      yy += k === '' && v === '' ? 6 : 14;
    }
    r.text('Esc / click to close', x + w / 2, y + h - 12, { align: 'center', size: 7, color: '#9cb0a0' });
    if (this.game.input.mouse.pressed && this.game.menuCooldown <= 0) this.close();
  }

  renderSleepConfirm() {
    const r = this.game.r;
    UI.panel(r, r.W / 2 - 90, r.H / 2 - 40, 180, 76);
    r.text('Go to sleep?', r.W / 2, r.H / 2 - 30, { align: 'center', size: 10, color: '#ffe46b' });
    r.text('Ends the day & saves your game.', r.W / 2, r.H / 2 - 14, { align: 'center', size: 7, color: '#9cb0a0' });
    UI.button(r, r.W / 2 - 70, r.H / 2 + 6, 60, 18, 'Sleep', this.hit(r.W / 2 - 70, r.H / 2 + 6, 60, 18));
    UI.button(r, r.W / 2 + 10, r.H / 2 + 6, 60, 18, 'Cancel', this.hit(r.W / 2 + 10, r.H / 2 + 6, 60, 18));
  }
}
