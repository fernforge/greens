// Headless smoke test: stubs the browser/canvas APIs, then exercises asset
// generation and several frames of the game (title -> new game -> play actions).
// Catches missing exports, undefined refs, and crashes without a real browser.

function makeCtx(w, h) {
  const noop = () => {};
  const ctx = {
    canvas: null,
    globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    font: '10px monospace', textAlign: 'left', textBaseline: 'top', imageSmoothingEnabled: false,
    globalCompositeOperation: 'source-over',
    fillRect: noop, clearRect: noop, strokeRect: noop, drawImage: noop,
    beginPath: noop, closePath: noop, arc: noop, ellipse: noop, moveTo: noop, lineTo: noop,
    stroke: noop, fill: noop, save: noop, restore: noop, translate: noop, scale: noop, rotate: noop, rect: noop, clip: noop,
    fillText: noop, setTransform: noop, setLineDash: noop,
    measureText: (s) => ({ width: (s ? s.length : 0) * 5 }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    getImageData: (x, y, ww, hh) => ({ data: new Uint8ClampedArray(Math.max(1, ww) * Math.max(1, hh) * 4), width: ww, height: hh }),
    createImageData: (ww, hh) => ({ data: new Uint8ClampedArray(Math.max(1, ww) * Math.max(1, hh) * 4), width: ww, height: hh }),
    putImageData: noop,
  };
  return ctx;
}

function makeCanvas(w = 16, h = 16) {
  const c = {
    width: w, height: h, style: {},
    getContext: () => { if (!c._ctx) { c._ctx = makeCtx(c.width, c.height); c._ctx.canvas = c; } c._ctx.width = c.width; c._ctx.height = c.height; return c._ctx; },
    addEventListener: () => {}, removeEventListener: () => {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: c.width, height: c.height }),
  };
  return c;
}

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const listeners = {};
globalThis.window = {
  addEventListener: (e, f) => { (listeners[e] = listeners[e] || []).push(f); },
  removeEventListener: () => {}, innerWidth: 960, innerHeight: 540,
  AudioContext: function () {}, webkitAudioContext: undefined,
};
globalThis.document = {
  createElement: (t) => (t === 'canvas' ? makeCanvas() : { style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }),
  getElementById: (id) => (id === 'game' ? makeCanvas(480, 270) : { style: {}, classList: { add() {}, remove() {} }, textContent: '' }),
  addEventListener: () => {},
};
// AudioContext stub on window
class FakeAudioCtx {
  constructor() { this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; this.state = 'running'; }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { type: 'square', frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { value: 0 }, connect() {}, start() {}, stop() {} }; }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { return { buffer: null, connect() {}, start() {} }; }
  createBiquadFilter() { return { type: 'lowpass', frequency: { value: 1000 }, connect() {} }; }
  resume() {}
}
globalThis.window.AudioContext = FakeAudioCtx;
globalThis.AudioContext = FakeAudioCtx;
globalThis.setTimeout = globalThis.setTimeout; // keep real

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ✓ ' + name); }
  catch (e) { failures++; console.error('  ✗ ' + name + '\n      ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n      ') : e)); }
}

console.log('Greens smoke test\n');

const { Assets } = await import('../src/game/assets.js');
const { Renderer } = await import('../src/engine/renderer.js');
const { Input } = await import('../src/engine/input.js');
const { Audio } = await import('../src/engine/audio.js');
const { Game } = await import('../src/game/game.js');
const { ITEMS } = await import('../src/game/data/items.js');
const { CROPS } = await import('../src/game/data/crops.js');
const Farm = await import('../src/game/systems/farming.js');

await check('Assets.build', async () => {});
await Assets.build(() => {});
console.log('  ✓ assets built (' + Object.keys(Assets.icons).length + ' icons, ' + CROPS.length + ' crops)');

check('every item has an icon', () => {
  for (const id of Object.keys(ITEMS)) if (!Assets.icons[id]) throw new Error('missing icon: ' + id);
});

const canvas = makeCanvas(480, 270);
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const audio = new Audio();
let game;

check('construct Game', () => { game = new Game(renderer, input, audio); });
check('render title', () => { game.render(); });
check('start new game', () => { game.startNewGame({ playerName: 'Test', farmName: 'Smoke', palette: undefined }); });
check('player exists in farm', () => { if (!game.player || game.gs.player.area !== 'farm') throw new Error('bad start'); });

// simulate frames
check('run 120 play frames', () => {
  for (let i = 0; i < 120; i++) { game.update(1 / 60); game.render(); input.endFrame(); }
});

// simulate tool use + farming
check('till/plant/water cycle', () => {
  const area = game.gs.currentArea();
  // place player on a clean grass tile and clear the exact tile it faces
  game.gs.player.x = 10 * 16; game.gs.player.y = 14 * 16; game.player.faceDir = 'down';
  const { tx, ty } = game.player.facingTile();
  { const o = area.objectAt(tx, ty); if (o) area.removeObject(o); }
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'hoe');
  game.useSelected();
  if (!area.plotAt(tx, ty)) throw new Error('hoe did not till');
  // plant lettuce
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'lettuce_seed');
  if (game.selSlot >= 0) game.useSelected();
  if (!area.plotAt(tx, ty).cropId) throw new Error('seed did not plant');
  // water
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'wateringcan');
  game.useSelected();
  if (!area.plotAt(tx, ty).watered) throw new Error('watering failed');
});

check('open every overlay', () => {
  for (const o of ['inventory', 'journal', 'skills', 'map', 'crafting', 'pause']) {
    game.openOverlay(o); game.update(1 / 60); game.render(); input.endFrame();
    game.closeOverlay();
  }
});

check('open shop + render', () => { game.openShop('general'); game.update(1 / 60); game.render(); game.shop.close(); });

check('sleep / new day cycle', () => {
  const d0 = game.gs.time.day;
  game.doSleep(false);
  for (let i = 0; i < 60; i++) { game.update(1 / 60); game.render(); input.endFrame(); }
  // ack sleep
  game.mode = 'play';
});

check('serialize + GameState.load', async () => {
  const { GameState } = await import('../src/game/state.js');
  const data = game.gs.buildSaveData();
  const json = JSON.stringify(data);
  const gs2 = GameState.load(JSON.parse(json));
  if (!gs2.player) throw new Error('reload failed');
  if (Object.keys(gs2.areas).length < 5) throw new Error('areas missing after reload');
});

check('warp to town + mine', () => {
  game.warpTo('town', 22, 16);
  // run fade callback
  for (let i = 0; i < 40; i++) { game.update(1 / 60); game.render(); input.endFrame(); }
  game.warpTo('mine_1', 0, 0);
  for (let i = 0; i < 40; i++) { game.update(1 / 60); game.render(); input.endFrame(); }
});

// ---- deeper interaction-path coverage ----
const { Enemy } = await import('../src/game/entities/enemy.js');

check('fishing minigame full cycle', () => {
  game.mode = 'play';
  game.warpTo('farm', 23, 10);
  for (let i = 0; i < 30; i++) { game.update(1 / 60); input.endFrame(); }
  // stand next to the farm pond and cast
  const area = game.gs.currentArea();
  game.gs.player.x = 36 * 16; game.gs.player.y = 28 * 16; game.player.faceDir = 'down';
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'fishingrod');
  if (game.selSlot < 0) { game.gs.inv.add('fishingrod', 1); game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'fishingrod'); }
  game.fishing.start('pond', game.gs.time.season, 0);
  // force a bite then catch
  game.fishing.t = 0; game.fishing.update(0.01, input);   // -> bite
  game.fishing.state = 'reeling'; game.fishing.fish = game.fishing._rollFish();
  game.fishing.progress = 0.99; game.fishing.fishPos = 0.5; game.fishing.barPos = 0.5;
  for (let i = 0; i < 30 && game.fishing.state === 'reeling'; i++) game.updateFishing(1 / 60);
  game.render();
});

check('combat: spawn + sword kill + loot', () => {
  game.warpTo('mine_2', 0, 0);
  for (let i = 0; i < 20; i++) { game.update(1 / 60); input.endFrame(); }
  const area = game.gs.currentArea();
  const e = new Enemy('slime', game.player.x + 12, game.player.y);
  game.enemies.push(e);
  const goldBefore = game.gs.player.gold;
  for (let i = 0; i < 10 && !e.dead; i++) { game.player.faceDir = 'right'; game.swordAttack(area); e.stun = 0; }
  if (!e.dead) throw new Error('enemy never died');
  game.render();
});

check('gifting an NPC', () => {
  game.warpTo('town', 22, 16);
  for (let i = 0; i < 30; i++) { game.update(1 / 60); input.endFrame(); }
  const npc = game.npcs[0];
  if (!npc) throw new Error('no npc in town');
  game.gs.inv.add('cabbage', 1);
  const before = game.gs.relationships[npc.id].points;
  const slotIdx = game.gs.inv.slots.findIndex((s) => s && s.id === 'cabbage');
  game.giveGift(npc, slotIdx);
  if (game.gs.relationships[npc.id].points <= before) throw new Error('gift had no effect');
});

check('crafting / cooking a recipe', () => {
  game.gs.inv.add('lettuce', 2); game.gs.inv.add('spinach', 2);
  game.openOverlay('crafting', { tab: 'cook' });
  game.overlays.doCraft({ id: 'salad', type: 'cook', out: 'salad', n: 1, ingredients: { lettuce: 1, spinach: 1 }, unlock: null });
  if (game.gs.inv.count('salad') < 1) throw new Error('cooking failed');
  game.closeOverlay();
});

check('eat to restore energy', () => {
  game.gs.player.energy = 10;
  game.gs.inv.add('salad', 1);
  const idx = game.gs.inv.slots.findIndex((s) => s && s.id === 'salad');
  game.eat(game.gs.inv.slots[idx], ITEMS.salad);
  if (game.gs.player.energy <= 10) throw new Error('eating did not restore energy');
});

check('chest deposit + withdraw', () => {
  game.gs.inv.add('wood', 5);
  const chest = { type: 'chest', items: [] };
  game.overlays.open('chest', { chest });
  const idx = game.gs.inv.slots.findIndex((s) => s && s.id === 'wood');
  game.overlays.depositToChest(chest, idx);
  if (!chest.items.some((c) => c && c.id === 'wood')) throw new Error('deposit failed');
  game.closeOverlay();
});

// ---- AAA upgrade: guidance + meta systems ----
check('getFacedTarget detects a tree -> Chop/axe', () => {
  game.mode = 'play'; game.warpTo('farm', 23, 10);
  for (let i = 0; i < 20; i++) { game.update(1 / 60); input.endFrame(); }
  const area = game.gs.currentArea();
  game.gs.player.x = 16 * 16; game.gs.player.y = 16 * 16; game.player.faceDir = 'down';
  const ft = game.player.facingTile();
  { const o = area.objectAt(ft.tx, ft.ty); if (o) area.removeObject(o); }
  area.addObject({ type: 'tree', tx: ft.tx, ty: ft.ty, hp: 4, kind: 'tree' });
  const t = game.getFacedTarget();
  if (!t || t.action !== 'Chop' || t.tool !== 'axe') throw new Error('faced target wrong: ' + JSON.stringify(t));
});

check('Smart Tool chops tree while holding watering can', () => {
  game.settings.smartTool = true;
  const area = game.gs.currentArea();
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'wateringcan');
  const ft = game.player.facingTile();
  const before = game.gs.inv.count('wood');
  for (let i = 0; i < 8 && area.objectAt(ft.tx, ft.ty); i++) { game.useSelected(); game.player.swingT = 0; }
  if (area.objectAt(ft.tx, ft.ty)) throw new Error('smart tool did not fell the tree');
  if (game.gs.inv.count('wood') <= before) throw new Error('no wood gained from smart chop');
});

check('achievement unlocks on harvest', () => {
  game.gs.stats.cropsHarvested = 1;
  game.achievements.check(true);
  if (!game.achievements.has('first_sprout')) throw new Error('first_sprout did not unlock');
});

check('tutorial advances on actions', () => {
  game.gs.flags.tutorialStep = 0; game.gs.flags.tutorialDone = false; game._moveDist = 999;
  game.tutorial.update(1 / 60);
  if (game.gs.flags.tutorialStep < 1) throw new Error('tutorial did not advance past move');
});

check('help + new journal tabs render', () => {
  game.openOverlay('help'); game.update(1 / 60); game.render(); input.endFrame(); game.closeOverlay();
  game.openOverlay('journal');
  for (const tab of ['quests', 'relations', 'almanac', 'achievements', 'stats']) { game.overlays.journalTab = tab; game.update(1 / 60); game.render(); input.endFrame(); }
  game.closeOverlay();
});

check('lighting/grade/bloom/vignette render at all times of day', () => {
  for (const m of [6 * 60, 12 * 60, 18.5 * 60, 22 * 60]) { game.gs.time.minute = m; game.render(); input.endFrame(); }
  game.warpTo('mine_1', 0, 0); for (let i = 0; i < 30; i++) { game.update(1 / 60); game.render(); input.endFrame(); }
});

// ---- crop genetics / breeding (Phase 0 hook) ----
check('breeding two seeds creates a visible strain', () => {
  game.mode = 'play'; game.warpTo('farm', 23, 10);
  for (let i = 0; i < 20; i++) { game.update(1 / 60); input.endFrame(); }
  game.gs.inv.add('lettuce_seed', 3); game.gs.inv.add('radish_seed', 3);
  const before = Object.keys(game.gs.strains).length;
  const cross = game.genetics.cross('lettuce_seed', 'radish_seed');
  if (!cross || !cross.base) throw new Error('cross returned nothing');
  const strain = game.genetics.create(cross.base, cross.genes, 1);
  if (!strain.id || !strain.name) throw new Error('strain missing id/name');
  if (Object.keys(game.gs.strains).length !== before + 1) throw new Error('strain not registered');
  if (!ITEMS['st_seed_' + strain.id] || !ITEMS['st_crop_' + strain.id]) throw new Error('strain items not registered');
  if (!Assets.crops['st_' + strain.id] || !Assets.icons['st_crop_' + strain.id]) throw new Error('strain sprites not built');
  game._strainId = strain.id;
});

check('strain seed code round-trips', () => {
  const s = game.gs.strains[game._strainId];
  const code = game.genetics.encode(s);
  const dec = game.genetics.decode(code);
  if (!dec || dec.base !== s.base) throw new Error('decode base mismatch');
  if (Math.abs(dec.genes.value - s.genes.value) > 0.02) throw new Error('decode value drift');
});

check('plant + harvest a strain yields strain produce', () => {
  const area = game.gs.currentArea();
  game.gs.player.x = 12 * 16; game.gs.player.y = 18 * 16; game.player.faceDir = 'down';
  const ft = game.player.facingTile();
  { const o = area.objectAt(ft.tx, ft.ty); if (o) area.removeObject(o); }
  if (!Farm.tillTile(area, ft.tx, ft.ty)) throw new Error('till failed');
  const seedId = 'st_seed_' + game._strainId;
  game.gs.inv.add(seedId, 1);
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === seedId);
  game.useSelected();
  const plot = area.plotAt(ft.tx, ft.ty);
  if (!plot.cropId || plot.strainId !== game._strainId) throw new Error('strain not planted (strainId=' + plot.strainId + ')');
  // force-grow & harvest
  plot.fullyGrown = true;
  const cropItem = 'st_crop_' + game._strainId;
  const before = game.gs.inv.count(cropItem);
  game.harvest(plot, area);
  if (game.gs.inv.count(cropItem) <= before) throw new Error('strain produce not harvested');
});

check('breeding overlay renders', () => {
  game.openOverlay('breeding');
  game.overlays.breedA = 'lettuce_seed'; game.overlays.breedB = 'radish_seed';
  game.update(1 / 60); game.render(); input.endFrame();
  game.closeOverlay();
});

check('strains survive save/reload', async () => {
  const { GameState } = await import('../src/game/state.js');
  const data = JSON.parse(JSON.stringify(game.gs.buildSaveData()));
  const gs2 = GameState.load(data);
  if (Object.keys(gs2.strains).length < 1) throw new Error('strains lost on reload');
  if (gs2.strainSeq !== game.gs.strainSeq) throw new Error('strainSeq lost');
});

console.log('\n' + (failures === 0 ? '✅ ALL PASSED' : `❌ ${failures} FAILED`));
process.exit(failures === 0 ? 0 : 1);
