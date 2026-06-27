// Heads-up display: clock/date, gold, vitals, hotbar, toasts, popups, fishing.
import { UI } from './widgets.js';
import { Assets } from '../assets.js';
import { ITEMS } from '../data/items.js';
import { HOTBAR_SIZE } from '../systems/inventory.js';
import { QUEST_BY_ID } from '../data/quests.js';

const WEATHER_ICON = { sunny: '☀', rainy: '☂', cloudy: '☁', stormy: '⛈', snowy: '❄' };

export const HUD = {
  render(game) {
    const r = game.r, gs = game.gs;
    // --- date / clock panel (top-left) ---
    UI.panel(r, 4, 4, 92, 30);
    r.text(`${gs.time.seasonName} ${gs.time.day}  ·  Y${gs.time.year}`, 10, 9, { size: 8, color: '#e8d8a8' });
    r.text(`${gs.time.dayName}   ${gs.time.clockString()}`, 10, 20, { size: 8, color: gs.time.isNight ? '#9cb0e0' : '#fff' });
    r.text(WEATHER_ICON[gs.time.weather] || '·', 86, 8, { size: 12, color: '#fff' });

    // --- gold (top-right) ---
    const gtext = `${gs.player.gold}g`;
    const gw = r.textWidth(gtext, 8) + 16;
    UI.panel(r, r.W - gw - 4, 4, gw, 16);
    r.text(gtext, r.W - 8, 9, { align: 'right', size: 8, color: '#ffe46b' });

    // --- vitals (right side) ---
    const p = gs.player;
    const vx = r.W - 78, vy = 24;
    UI.panel(r, vx - 4, vy - 2, 78, 26);
    r.text('EN', vx, vy + 1, { size: 7, color: '#aede6a' });
    UI.bar(r, vx + 16, vy, 50, 6, p.energy / p.maxEnergy, p.energy / p.maxEnergy < 0.2 ? '#e85f5f' : '#7cc04f');
    r.text('HP', vx, vy + 11, { size: 7, color: '#e88' });
    UI.bar(r, vx + 16, vy + 10, 50, 6, p.health / p.maxHealth, '#e25f5f');

    // --- hotbar (bottom center) ---
    this.hotbar(game);

    // --- toasts (above hotbar) ---
    let ty = r.H - 44;
    for (let i = game.toasts.length - 1; i >= 0; i--) {
      const t = game.toasts[i];
      const a = Math.min(1, t.t * 1.4);
      r.ctx.globalAlpha = a;
      const tw = r.textWidth(t.text, 8) + 12;
      UI.panel(r, (r.W - tw) / 2, ty, tw, 14, { alpha: a });
      r.text(t.text, r.W / 2, ty + 3, { align: 'center', size: 8, color: t.color });
      r.ctx.globalAlpha = 1;
      ty -= 17;
    }

    // --- skill/quest popups (top center) ---
    let py = 40;
    for (const pop of game.popups) {
      const a = Math.min(1, pop.t);
      r.ctx.globalAlpha = a;
      const pw = r.textWidth(pop.text, 8) + 18;
      UI.panel(r, (r.W - pw) / 2, py, pw, 16, { border: pop.color });
      r.text(pop.text, r.W / 2, py + 4, { align: 'center', size: 8, color: pop.color });
      r.ctx.globalAlpha = 1;
      py += 20;
    }

    // --- quest tracker (top-right, under gold/vitals) ---
    this.questTracker(game);
    // --- tutorial objective banner (top center) ---
    this.tutorialBanner(game, py);
  },

  questTracker(game) {
    const r = game.r, gs = game.gs;
    if (!game.quests) return;
    const active = gs.quests.active.map((id) => ({ id, q: QUEST_BY_ID[id] })).filter((x) => x.q);
    // prefer a story quest, else first active
    let pick = active.find((x) => x.q.story) || active[0];
    if (!pick) return;
    const q = pick.q;
    const done = game.quests.isComplete(q);
    const prog = game.quests.progressText(q);
    const w = 116, x = r.W - w - 4, y = 52;
    UI.panel(r, x, y, w, 24, { border: done ? '#aede6a' : '#caa15e' });
    r.text('✦ ' + q.title, x + 6, y + 4, { size: 7, color: done ? '#aede6a' : '#ffe46b' });
    r.text(done ? 'Ready — turn in!' : prog, x + 6, y + 14, { size: 7, color: done ? '#aede6a' : '#cfe0c0' });
  },

  tutorialBanner(game, afterY) {
    const t = game.tutorial;
    if (!t || (!t.active && t.bannerY <= -19)) return;
    const r = game.r;
    const s = t.step;
    if (!s) return;
    const by = Math.round(r.H - 64 + t.bannerY * 0); // anchored above hotbar
    const y = r.H - 70;
    const flash = t.flashT > 0 ? Math.sin(t.flashT * 20) * 0.5 + 0.5 : 0;
    const text = s.text;
    const w = Math.min(r.W - 20, Math.max(r.textWidth(text, 8), r.textWidth(s.hint, 7)) + 28);
    const x = (r.W - w) / 2;
    UI.panel(r, x, y, w, 26, { border: flash > 0.3 ? '#fff' : '#7cc04f' });
    r.text('◈ ' + text, x + 8, y + 4, { size: 8, color: '#fff' });
    r.text(s.hint, x + 8, y + 15, { size: 7, color: '#9ad96a' });
  },

  hotbar(game) {
    const r = game.r, gs = game.gs;
    const cell = 18, gap = 1, n = HOTBAR_SIZE;
    const totalW = n * cell + (n - 1) * gap;
    const x0 = (r.W - totalW) / 2, y = r.H - cell - 4;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cell + gap);
      const slot = gs.inv.slots[i];
      UI.slot(r, x, y, slot, { selected: i === game.selSlot, size: cell });
      // hotkey number
      r.text(String((i + 1) % 10), x + 1, y - 7, { size: 6, color: '#6b6450' });
    }
    // selected item name
    const sel = gs.inv.slots[game.selSlot];
    if (sel) {
      const def = ITEMS[sel.id];
      r.text(def?.name || sel.id, r.W / 2, y - 11, { align: 'center', size: 8, color: '#e8d8a8' });
    }
  },

  renderFishing(game) {
    const r = game.r, f = game.fishing;
    if (f.state === 'waiting') {
      r.text('…waiting for a bite… (release line: Esc)', r.W / 2, r.H / 2 - 30, { align: 'center', size: 8, color: '#9cd0ff' });
      // bobber dip animation could go here
    } else if (f.state === 'bite') {
      r.text('!!  PRESS SPACE  !!', r.W / 2, r.H / 2 - 30, { align: 'center', size: 12, color: '#ffe46b' });
    } else if (f.state === 'reeling') {
      // vertical catch bar
      const bx = r.W / 2 + 70, by = 50, bw = 12, bh = 120;
      UI.panel(r, bx - 4, by - 6, bw + 8, bh + 12);
      r.rectScreen(bx, by, bw, bh, '#16210f');
      // green zone (player bar)
      const zoneH = f.zone * 2 * bh;
      const barY = by + (f.barPos * bh) - zoneH / 2;
      r.rectScreen(bx, barY, bw, zoneH, '#4f9c4f');
      // fish marker
      const fy = by + f.fishPos * bh - 4;
      const fishIcon = Assets.icon(f.fish?.id);
      if (fishIcon) r.spriteScreen(fishIcon, bx - 2, fy - 4, { w: 16, h: 16 });
      else r.rectScreen(bx, fy, bw, 8, '#fff');
      // progress
      UI.bar(r, bx - 4, by + bh + 8, bw + 8, 6, f.progress, '#7cc04f');
      r.text('Hold SPACE to reel', r.W / 2 + 70, by - 18, { align: 'center', size: 7, color: '#cfe0c0' });
      if (f.fish) r.text(f.fish.name, r.W / 2 + 70, by + bh + 16, { align: 'center', size: 7, color: '#9cd0ff' });
    }
  },

  daySummaryPanel(game, x, y, w, h, s) {
    const r = game.r;
    UI.panel(r, x, y, w, h);
    r.text(`☾  ${game.gs.time.dayName}, ${game.gs.time.seasonName} ${game.gs.time.day}`, x + w / 2, y + 10, { align: 'center', size: 10, color: '#e8d8a8' });
    r.text(`A new day dawns.`, x + w / 2, y + 26, { align: 'center', size: 8, color: '#9cb0a0' });
    r.text(`Shipping earnings:`, x + 16, y + 48, { size: 8, color: '#fff' });
    r.text(`+${s.earnings}g`, x + w - 16, y + 48, { align: 'right', size: 8, color: '#ffe46b' });
    r.text(`Weather: ${WEATHER_ICON[game.gs.time.weather]} ${game.gs.time.weather}`, x + 16, y + 64, { size: 8, color: '#cfe0c0' });
    r.text(`Gold: ${game.gs.player.gold}g`, x + 16, y + 80, { size: 8, color: '#ffe46b' });
    r.text('Press Enter to begin the day', x + w / 2, y + h - 16, { align: 'center', size: 8, color: '#aede6a' });
  },
};
