// Title screen, save-slot picker, and character creation.
import { UI } from './widgets.js';
import { Assets, PLAYER_PRESETS, buildPlayerSprites } from '../assets.js';
import { SaveManager } from '../../engine/save.js';
import * as G from '../../engine/spritegen.js';
import { SEASON_NAMES } from '../data/crops.js';

export class Title {
  constructor(game) {
    this.game = game;
    this.screen = 'main';     // main | slots | create | settings
    this.sel = 0;
    this.t = 0;
    this.bgClouds = [];
    for (let i = 0; i < 6; i++) this.bgClouds.push({ x: Math.random() * 480, y: 20 + Math.random() * 80, s: 0.2 + Math.random() * 0.4 });
    this.petals = [];
    const pc = ['#f2c1d8', '#ffd8e8', '#fff', '#aede6a'];
    for (let i = 0; i < 24; i++) this.petals.push({ x: Math.random() * 480, y: Math.random() * 270, vx: -8 - Math.random() * 14, vy: 8 + Math.random() * 16, s: 1 + (Math.random() * 2 | 0), c: pc[Math.random() * pc.length | 0] });
    // create form
    this.form = { playerName: 'Sage', farmName: 'Green', palette: 0 };
    this.focus = 'playerName';
    this.slotsMode = 'new';   // new | continue
    this.preview = null;
    this._bindTyping();
  }

  _bindTyping() {
    window.addEventListener('keydown', (e) => {
      if (this.game.mode !== 'title' && this.game.mode !== 'charcreate') return;
      if (this.screen !== 'create') return;
      const field = this.focus;
      if (e.key === 'Backspace') { this.form[field] = this.form[field].slice(0, -1); e.preventDefault(); }
      else if (e.key.length === 1 && /[A-Za-z0-9 '\-]/.test(e.key) && this.form[field].length < 12) { this.form[field] += e.key; }
      else if (e.key === 'Tab') { this.focus = this.focus === 'playerName' ? 'farmName' : 'playerName'; e.preventDefault(); }
    });
  }

  toSlots(mode = 'continue') { this.screen = 'slots'; this.slotsMode = mode; this.sel = 0; this.game.mode = 'title'; }

  mainItems() {
    const hasSaves = SaveManager.slots().some((s) => !s.empty);
    return hasSaves ? ['New Game', 'Continue', 'Settings'] : ['New Game', 'Settings'];
  }

  update(dt) {
    this.t += dt;
    for (const c of this.bgClouds) { c.x += c.s * 10 * dt; if (c.x > 500) c.x = -40; }
    for (const p of this.petals) { p.x += p.vx * dt; p.y += p.vy * dt + Math.sin((this.t + p.x) * 2) * 0.2; if (p.y > 280 || p.x < -10) { p.x = 490; p.y = Math.random() * 200 - 20; } }
    const i = this.game.input;
    if (i.anyKeyPressed || i.mouse.pressed) this.game.audio.init(), this.game.audio.resume(), this.game.audio.playMusic('title');

    if (this.screen === 'main') this.updateMain();
    else if (this.screen === 'slots') this.updateSlots();
    else if (this.screen === 'create') this.updateCreate();
    else if (this.screen === 'settings') this.updateSettings();
  }

  hit(x, y, w, h) { const m = this.game.input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }

  updateMain() {
    const i = this.game.input, items = this.mainItems();
    if (i.justPressed('up')) { this.sel = (this.sel + items.length - 1) % items.length; this.game.audio.sfx('select'); }
    if (i.justPressed('down')) { this.sel = (this.sel + 1) % items.length; this.game.audio.sfx('select'); }
    const r = this.game.r, x = r.W / 2 - 60, y0 = 150;
    for (let k = 0; k < items.length; k++) { if (this.hit(x, y0 + k * 22, 120, 18)) { this.sel = k; if (i.mouse.pressed) this.chooseMain(k); } }
    if (i.justPressed('confirm') || i.justPressed('use')) this.chooseMain(this.sel);
  }
  chooseMain(k) {
    const label = this.mainItems()[k];
    this.game.audio.sfx('confirm');
    if (label === 'New Game') { this.screen = 'slots'; this.slotsMode = 'new'; this.sel = 0; }
    else if (label === 'Continue') { this.screen = 'slots'; this.slotsMode = 'continue'; this.sel = 0; }
    else if (label === 'Settings') { this.screen = 'settings'; }
  }

  updateSlots() {
    const i = this.game.input;
    const slots = SaveManager.slots();
    const r = this.game.r;
    if (i.justPressed('menu')) { this.screen = 'main'; return; }
    for (let s = 0; s < 3; s++) {
      const y = 70 + s * 44;
      if (this.hit(r.W / 2 - 130, y, 260, 38)) { this.sel = s; if (i.mouse.pressed) this.chooseSlot(s); }
      // delete button
      if (!slots[s].empty && this.hit(r.W / 2 + 100, y + 2, 26, 14) && i.mouse.pressed) { SaveManager.delete(s); this.game.audio.sfx('error'); return; }
    }
    if (i.justPressed('up')) this.sel = (this.sel + 2) % 3;
    if (i.justPressed('down')) this.sel = (this.sel + 1) % 3;
    if (i.justPressed('confirm') || i.justPressed('use')) this.chooseSlot(this.sel);
  }
  chooseSlot(s) {
    const slots = SaveManager.slots();
    this.game.audio.sfx('confirm');
    if (this.slotsMode === 'continue') {
      if (slots[s].empty) { this.game.audio.sfx('error'); return; }
      this.targetSlot = s;
      if (this.game.loadFromSave(s)) this.game.gs._slot = s;
    } else {
      // new game in this slot (overwrites)
      this.targetSlot = s;
      this.screen = 'create';
      this.focus = 'playerName';
      buildPlayerSprites(PLAYER_PRESETS[this.form.palette].pal);
    }
  }

  updateCreate() {
    const i = this.game.input;
    const r = this.game.r;
    if (i.justPressed('menu')) { this.screen = 'slots'; return; }
    // palette swatches
    const sw = 22, sx0 = r.W / 2 - (PLAYER_PRESETS.length * (sw + 4)) / 2;
    for (let k = 0; k < PLAYER_PRESETS.length; k++) {
      const x = sx0 + k * (sw + 4), y = 150;
      if (this.hit(x, y, sw, sw) && i.mouse.pressed) { this.form.palette = k; buildPlayerSprites(PLAYER_PRESETS[k].pal); this.game.audio.sfx('select'); }
    }
    // focus fields
    if (this.hit(r.W / 2 - 30, 70, 120, 16) && i.mouse.pressed) this.focus = 'playerName';
    if (this.hit(r.W / 2 - 30, 96, 120, 16) && i.mouse.pressed) this.focus = 'farmName';
    // start
    const startHover = this.hit(r.W / 2 - 50, 200, 100, 20);
    if ((startHover && i.mouse.pressed) || i.justPressed('confirm')) this.startGame();
  }
  startGame() {
    if (!this.form.playerName.trim()) this.form.playerName = 'Sage';
    if (!this.form.farmName.trim()) this.form.farmName = 'Green';
    this.game.audio.sfx('confirm');
    this.game.startNewGame({ playerName: this.form.playerName.trim(), farmName: this.form.farmName.trim(), palette: PLAYER_PRESETS[this.form.palette].pal });
    this.game.gs._slot = this.targetSlot ?? 0;
  }

  updateSettings() {
    const i = this.game.input;
    if (i.justPressed('menu') || i.justPressed('confirm')) { this.screen = 'main'; return; }
    const r = this.game.r;
    const s = this.game.overlays.settings;
    if (this.hit(r.W / 2 - 80, 90, 160, 18) && i.mouse.pressed) { s.muteMusic = !s.muteMusic; this.game.audio.setMusicVol(s.muteMusic ? 0 : 0.4); SaveManager.saveSettings(s); }
    if (this.hit(r.W / 2 - 80, 114, 160, 18) && i.mouse.pressed) { s.muteSfx = !s.muteSfx; this.game.audio.setSfxVol(s.muteSfx ? 0 : 0.6); SaveManager.saveSettings(s); }
    if (this.hit(r.W / 2 - 80, 150, 160, 18) && i.mouse.pressed) this.screen = 'main';
  }

  render() {
    const r = this.game.r, ctx = r.ctx;
    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, r.H);
    g.addColorStop(0, '#7fc8e8'); g.addColorStop(0.6, '#b8e0a8'); g.addColorStop(1, '#6cae44');
    ctx.fillStyle = g; ctx.fillRect(0, 0, r.W, r.H);
    // sun with soft glow
    const sunX = r.W - 60, sunY = 50;
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
    sg.addColorStop(0, 'rgba(255,243,176,0.5)'); sg.addColorStop(1, 'rgba(255,243,176,0)');
    ctx.fillStyle = sg; ctx.fillRect(sunX - 60, sunY - 60, 120, 120);
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();
    // clouds
    ctx.fillStyle = '#ffffff';
    for (const c of this.bgClouds) { ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(c.x, c.y, 22, 9, 0, 0, Math.PI * 2); ctx.ellipse(c.x + 16, c.y + 3, 16, 7, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // far parallax hills
    ctx.fillStyle = '#86c060'; ctx.beginPath(); ctx.moveTo(0, r.H); for (let x = 0; x <= r.W; x += 8) ctx.lineTo(x, r.H - 78 - Math.sin(x * 0.012 + 2) * 12); ctx.lineTo(r.W, r.H); ctx.fill();
    // rolling hills
    ctx.fillStyle = '#5b9d3e'; ctx.beginPath(); ctx.moveTo(0, r.H); for (let x = 0; x <= r.W; x += 8) ctx.lineTo(x, r.H - 50 - Math.sin(x * 0.02 + 1) * 14); ctx.lineTo(r.W, r.H); ctx.fill();
    // tiny crop rows on the near hill
    ctx.fillStyle = '#3f7a2e';
    for (let x = 20; x < r.W; x += 26) { const hy = r.H - 28 - Math.sin(x * 0.03) * 10; ctx.fillRect(x, hy - 4, 2, 6); ctx.fillRect(x + 8, hy - 5, 2, 7); ctx.fillRect(x + 16, hy - 4, 2, 6); }
    ctx.fillStyle = '#4f8c36'; ctx.beginPath(); ctx.moveTo(0, r.H); for (let x = 0; x <= r.W; x += 8) ctx.lineTo(x, r.H - 28 - Math.sin(x * 0.03) * 10); ctx.lineTo(r.W, r.H); ctx.fill();
    // drifting petals
    for (const p of this.petals) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    r.vignette(0.28, '#1a2a10');

    if (this.screen === 'main') this.renderMain();
    else if (this.screen === 'slots') this.renderSlots();
    else if (this.screen === 'create') this.renderCreate();
    else if (this.screen === 'settings') this.renderSettings();
  }

  titleLogo() {
    const r = this.game.r;
    const bob = Math.sin(this.t * 2) * 3;
    r.text('GREENS', r.W / 2, 56 + bob, { align: 'center', size: 40, color: '#2c5c1e', shadow: null });
    r.text('GREENS', r.W / 2 - 2, 54 + bob, { align: 'center', size: 40, color: '#aede6a', shadow: '#2c5c1e' });
    r.text('a farming life', r.W / 2, 96, { align: 'center', size: 9, color: '#2c5c1e', shadow: null });
  }

  renderMain() {
    const r = this.game.r;
    this.titleLogo();
    const items = this.mainItems(), x = r.W / 2 - 60, y0 = 150;
    for (let k = 0; k < items.length; k++) UI.button(r, x, y0 + k * 22, 120, 18, items[k], this.sel === k);
    r.text('v1.0 · made with code, no art assets', r.W / 2, r.H - 12, { align: 'center', size: 7, color: '#2c5c1e', shadow: null });
  }

  renderSlots() {
    const r = this.game.r;
    UI.panel(r, r.W / 2 - 150, 36, 300, 200);
    r.text(this.slotsMode === 'new' ? 'New Game — choose a slot' : 'Continue', r.W / 2, 44, { align: 'center', size: 10, color: '#ffe46b' });
    const slots = SaveManager.slots();
    for (let s = 0; s < 3; s++) {
      const y = 70 + s * 44;
      const hover = this.hit(r.W / 2 - 130, y, 260, 38) || this.sel === s;
      UI.panel(r, r.W / 2 - 130, y, 260, 38, { fill: hover ? '#3a2c1e' : '#2b2118', border: hover ? '#e8d8a0' : '#caa15e' });
      const m = slots[s];
      if (m.empty) r.text(`Slot ${s + 1} — Empty`, r.W / 2 - 120, y + 14, { size: 9, color: '#9cb0a0' });
      else {
        r.text(`${m.farmName} Farm`, r.W / 2 - 120, y + 6, { size: 9, color: '#fff' });
        r.text(`${m.playerName} · ${SEASON_NAMES[m.season]} ${m.day}, Y${m.year} · ${m.gold}g`, r.W / 2 - 120, y + 20, { size: 7, color: '#cfe0c0' });
        r.text('✕', r.W / 2 + 112, y + 4, { size: 9, color: '#e88' });
      }
    }
    r.text('Esc to go back', r.W / 2, 226, { align: 'center', size: 7, color: '#9cb0a0' });
  }

  renderCreate() {
    const r = this.game.r;
    UI.panel(r, r.W / 2 - 150, 36, 300, 210);
    r.text('New Farmer', r.W / 2, 44, { align: 'center', size: 11, color: '#ffe46b' });
    // name fields
    r.text('Name', r.W / 2 - 95, 74, { size: 8, color: '#cfe0c0' });
    UI.panel(r, r.W / 2 - 30, 70, 120, 16, { fill: this.focus === 'playerName' ? '#3a4a2e' : '#1f1810' });
    r.text(this.form.playerName + (this.focus === 'playerName' && Math.floor(this.t * 2) % 2 ? '|' : ''), r.W / 2 - 24, 74, { size: 9, color: '#fff' });
    r.text('Farm', r.W / 2 - 95, 100, { size: 8, color: '#cfe0c0' });
    UI.panel(r, r.W / 2 - 30, 96, 120, 16, { fill: this.focus === 'farmName' ? '#3a4a2e' : '#1f1810' });
    r.text(this.form.farmName + (this.focus === 'farmName' && Math.floor(this.t * 2) % 2 ? '|' : '') + ' Farm', r.W / 2 - 24, 100, { size: 9, color: '#fff' });
    // palette swatches + preview
    r.text('Look', r.W / 2 - 95, 130, { size: 8, color: '#cfe0c0' });
    const sw = 22, sx0 = r.W / 2 - (PLAYER_PRESETS.length * (sw + 4)) / 2;
    for (let k = 0; k < PLAYER_PRESETS.length; k++) {
      const x = sx0 + k * (sw + 4), y = 150;
      UI.panel(r, x, y, sw, sw, { fill: PLAYER_PRESETS[k].pal.shirt, border: this.form.palette === k ? '#fff' : '#3a2a1c' });
      // mini character
      if (Assets.player && this.form.palette === k) {}
    }
    // big preview of selected character
    if (Assets.player) {
      const f = Math.floor(this.t * 6) % 4;
      r.spriteScreen(Assets.player.down[f], r.W / 2 + 96, 140, { w: 32, h: 48 });
    }
    r.text(PLAYER_PRESETS[this.form.palette].name, r.W / 2 + 112, 190, { align: 'center', size: 7, color: '#cfe0c0' });
    UI.button(r, r.W / 2 - 50, 200, 100, 20, 'Start Farming!', this.hit(r.W / 2 - 50, 200, 100, 20));
    r.text('Type to name · Tab switches field · Esc back', r.W / 2, 234, { align: 'center', size: 6, color: '#9cb0a0' });
  }

  renderSettings() {
    const r = this.game.r;
    const s = this.game.overlays.settings;
    UI.panel(r, r.W / 2 - 100, 50, 200, 130);
    r.text('Settings', r.W / 2, 58, { align: 'center', size: 11, color: '#ffe46b' });
    UI.button(r, r.W / 2 - 80, 90, 160, 18, 'Music: ' + (s.muteMusic ? 'Off' : 'On'), this.hit(r.W / 2 - 80, 90, 160, 18));
    UI.button(r, r.W / 2 - 80, 114, 160, 18, 'Sound: ' + (s.muteSfx ? 'Off' : 'On'), this.hit(r.W / 2 - 80, 114, 160, 18));
    UI.button(r, r.W / 2 - 80, 150, 160, 18, 'Back', this.hit(r.W / 2 - 80, 150, 160, 18));
  }
}
