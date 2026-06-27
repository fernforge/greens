// Guided onboarding. A gentle, non-blocking step sequence shown as a HUD
// objective banner. Steps auto-advance as the player performs each action, so
// new players learn the core loop without reading a manual. Fully skippable.

export const TUT_STEPS = [
  { id: 'move', text: 'Move with WASD or the Arrow keys.', hint: 'Take a stroll around your farm.',
    check: (g) => (g._moveDist || 0) > 60 },
  { id: 'till', text: 'Face the grass and press SPACE to till soil with your Hoe.', hint: 'Smart Tool auto-picks the right tool for you.',
    check: (g) => anyFarm(g, (p) => true) },
  { id: 'plant', text: 'Select Seeds on the hotbar (keys 1–0 or scroll), then press SPACE on tilled soil to plant.', hint: 'You start with Lettuce, Radish & Parsnip seeds.',
    check: (g) => anyFarm(g, (p) => p.cropId) },
  { id: 'water', text: 'Press SPACE again to water your crop. Watered crops grow overnight.', hint: 'Rain waters everything for free!',
    check: (g) => anyFarm(g, (p) => p.watered) },
  { id: 'chop', text: 'Find a tree and press SPACE to chop it for Wood.', hint: 'Different things need different tools — the prompt shows which.',
    check: (g) => (g.gs.flags.everChopped) },
  { id: 'forage', text: 'Walk up to a weed or wild plant and press E to clear or gather it.', hint: 'Foraging, mining, fishing & combat each level up separately.',
    check: (g) => (g.gs.flags.everForaged || g.gs.inv.count('fiber') > 0) },
  { id: 'explore', text: 'Head down the south path to Hollowbrook Town — meet folk, take quests, and sell crops.', hint: 'Press J for your Journal, M for the map, Esc for the menu & Help.',
    check: (g) => (g.gs.player.area === 'town' || g.gs.flags.openedJournal) },
];

export class Tutorial {
  constructor(game) {
    this.game = game;
    this.flashT = 0;
    this.bannerY = -20;
  }
  get gs() { return this.game.gs; }
  get active() { return this.gs && !this.gs.flags.tutorialDone && this.gs.flags.tutorialStep != null && this.gs.flags.tutorialStep < TUT_STEPS.length; }
  get step() { return TUT_STEPS[this.gs.flags.tutorialStep] || null; }

  start() { this.gs.flags.tutorialStep = 0; this.gs.flags.tutorialDone = false; }
  skip() { this.gs.flags.tutorialDone = true; this.game.toast('Tutorial skipped. Press Esc → Help anytime.', '#9cd0ff'); }

  update(dt) {
    if (!this.active) { this.bannerY += (-20 - this.bannerY) * Math.min(1, dt * 8); return; }
    this.bannerY += (0 - this.bannerY) * Math.min(1, dt * 8);
    this.flashT = Math.max(0, this.flashT - dt);
    const s = this.step;
    if (s && s.check(this.game)) {
      this.gs.flags.tutorialStep++;
      this.flashT = 1;
      this.game.audio.sfx('confirm');
      if (this.gs.flags.tutorialStep >= TUT_STEPS.length) {
        this.gs.flags.tutorialDone = true;
        this.game.popups.push({ text: '✓ Tutorial complete — happy farming!', t: 4, color: '#aede6a' });
        this.game.audio.sfx('quest');
      }
    }
  }
}

function anyFarm(g, pred) {
  const farm = g.gs.areas.farm;
  if (!farm) return false;
  for (const p of farm.farmland.values()) if (pred(p)) return true;
  return false;
}
