// Render the actual game to PNG files using @napi-rs/canvas as the canvas
// backend (no browser/system libs needed). Drives real gameplay states.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('test/shots', { recursive: true });

// --- DOM/browser stubs backed by a real canvas implementation ---
globalThis.document = {
  createElement: (t) => { if (t === 'canvas') { const c = createCanvas(16, 16); c.style = {}; c.addEventListener = () => {}; return c; } return { style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }; },
  getElementById: () => ({ style: {}, classList: { add() {}, remove() {} }, textContent: '' }),
  addEventListener: () => {},
};
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
globalThis.performance = { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
class FakeAudioCtx { constructor() { this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; this.state = 'running'; } createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } createOscillator() { return { type: 's', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { value: 0 }, connect() {}, start() {}, stop() {} }; } createBuffer(c, l) { return { getChannelData: () => new Float32Array(l) }; } createBufferSource() { return { connect() {}, start() {} }; } createBiquadFilter() { return { frequency: { value: 0 }, type: '', connect() {} }; } resume() {} }
globalThis.window = { addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 960, innerHeight: 540, AudioContext: FakeAudioCtx };
globalThis.AudioContext = FakeAudioCtx;

const { Assets } = await import('../src/game/assets.js');
const { Renderer } = await import('../src/engine/renderer.js');
const { Input } = await import('../src/engine/input.js');
const { Audio } = await import('../src/engine/audio.js');
const { Game } = await import('../src/game/game.js');
const Farm = await import('../src/game/systems/farming.js');

await Assets.build(() => {});

// main display canvas
const canvas = createCanvas(480, 270);
canvas.style = {}; canvas.addEventListener = () => {}; canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 270 });
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const audio = new Audio();
const game = new Game(renderer, input, audio);

function save(name) { writeFileSync(`test/shots/${name}.png`, canvas.toBuffer('image/png')); console.log('  saved ' + name); }
function frames(n, dt = 1 / 60) { for (let i = 0; i < n; i++) { game.update(dt); game.render(); input.endFrame(); } }

// title
frames(20); save('01-title');

// new game
game.startNewGame({ playerName: 'Sage', farmName: 'Green', palette: undefined });
frames(30); save('02-farm');

// build a planted, watered, partly-grown field
const area = game.gs.currentArea();
for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 6; dx++) {
  const tx = 8 + dx, ty = 13 + dy; const o = area.objectAt(tx, ty); if (o) area.removeObject(o);
  Farm.tillTile(area, tx, ty);
  Farm.plantSeed(area, tx, ty, ['lettuce', 'radish', 'parsnip', 'kale', 'potato', 'cabbage'][dx]);
  Farm.waterTile(area, tx, ty);
  const plot = area.plotAt(tx, ty); plot.age = dy * 3; if (dy === 3) plot.fullyGrown = true;
}
game.gs.player.x = 7 * 16; game.gs.player.y = 12 * 16; game.player.faceDir = 'right';
frames(10); save('03-crops-day');

// context prompt + tutorial banner: face a tree
{
  // place a tree right in front of the player
  game.gs.player.x = 20 * 16; game.gs.player.y = 16 * 16; game.player.faceDir = 'down';
  const t = game.player.facingTile();
  if (!area.objectAt(t.tx, t.ty)) area.addObject({ type: 'tree', tx: t.tx, ty: t.ty, hp: 4, kind: 'tree' });
  game.selSlot = game.gs.inv.slots.findIndex((s) => s && s.id === 'wateringcan'); // wrong tool on purpose
  frames(6); save('03b-context-prompt');
}

// dusk lighting
game.gs.time.minute = 19.5 * 60; frames(5); save('04-dusk');

// inventory
game.gs.time.minute = 12 * 60;
game.openOverlay('inventory'); frames(5); save('05-inventory'); game.closeOverlay();

// crafting
game.openOverlay('crafting', { tab: 'cook' }); frames(5); save('06-cooking'); game.closeOverlay();

// town
game.warpTo('town', 22, 16); frames(40); save('07-town');

// talk to an NPC if adjacent
const npc = game.npcs[0];
if (npc) { game.gs.player.x = npc.x; game.gs.player.y = npc.y + 18; game.talkTo(npc); frames(20); save('08-dialogue'); game.dialogue.close(); }

// journal + new tabs
game.openOverlay('journal'); frames(5); save('09-journal');
game.overlays.journalTab = 'almanac'; game.gs.stats.cropsSeen = ['lettuce', 'radish', 'kale']; game.gs.stats.fishCaught = ['minnow', 'carp']; frames(5); save('09b-almanac');
game.overlays.journalTab = 'achievements'; game.gs.flags.achievements = ['first_sprout', 'hooked']; frames(5); save('09c-achievements');
game.closeOverlay();
game.openOverlay('map'); frames(5); save('10-map'); game.closeOverlay();
// help screen
game.openOverlay('help'); frames(5); save('10b-help'); game.closeOverlay();

// mine with enemies
game.warpTo('mine_1', 0, 0); frames(50); save('11-mine');

// shop
game.warpTo('town', 22, 16); frames(30); game.openShop('general'); frames(5); save('12-shop');

console.log('done');
process.exit(0);
