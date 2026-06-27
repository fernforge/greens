// Visual proof of the genetics hook: breed strains and show their colour-shifted
// crops growing next to the base crop, plus the breeding bench UI.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('test/shots', { recursive: true });
globalThis.document = { createElement: (t) => { if (t === 'canvas') { const c = createCanvas(16, 16); c.style = {}; c.addEventListener = () => {}; return c; } return { style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }; }, getElementById: () => ({ style: {}, classList: { add() {}, remove() {} }, textContent: '' }), addEventListener: () => {} };
const store = {}; globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
globalThis.performance = { now: () => Date.now() }; globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
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

const canvas = createCanvas(480, 270);
canvas.style = {}; canvas.addEventListener = () => {}; canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 270 });
const renderer = new Renderer(canvas);
const game = new Game(renderer, new Input(canvas), new Audio());
const save = (n) => { writeFileSync(`test/shots/${n}.png`, canvas.toBuffer('image/png')); console.log('saved ' + n); };
const frames = (n) => { for (let i = 0; i < n; i++) { game.update(1 / 60); game.render(); } };

game.startNewGame({ playerName: 'Sage', farmName: 'Green', palette: undefined });
frames(20);
const area = game.gs.currentArea();

// Engineer several lettuce strains with forced, distinct hues so the colour range is obvious.
const strains = [];
for (let i = 0; i < 6; i++) {
  const hue = -150 + i * 55;
  const s = game.genetics.create('lettuce', { hue, yield: 1 + i * 0.4, speed: 0.1, value: 1 + i * 0.3, hardiness: 0.2 }, 1, null);
  strains.push(s);
}
// Plant a row: base lettuce then the 6 strains, all fully grown.
const baseRow = 16;
const plantAt = (tx, ty, cropId, strainId) => {
  const o = area.objectAt(tx, ty); if (o) area.removeObject(o);
  Farm.tillTile(area, tx, ty);
  Farm.plantSeed(area, tx, ty, cropId, strainId || null);
  const p = area.plotAt(tx, ty); p.fullyGrown = true;
};
plantAt(8, baseRow, 'lettuce', null);
strains.forEach((s, i) => plantAt(10 + i * 2, baseRow, 'lettuce', s.id));
game.gs.player.x = 8 * 16; game.gs.player.y = (baseRow - 2) * 16; game.player.faceDir = 'down';
frames(8);
save('g1-strain-field');

// Breeding bench UI with two parents selected + offspring preview.
game.gs.inv.add('lettuce_seed', 5); game.gs.inv.add('radish_seed', 5);
game.gs.inv.add('st_seed_' + strains[1].id, 3); game.gs.inv.add('st_seed_' + strains[4].id, 3);
game.openBreeding();
game.overlays.breedA = 'st_seed_' + strains[1].id;
game.overlays.breedB = 'st_seed_' + strains[4].id;
game.overlays.lastStrain = strains[4];
game.overlays.codeMsg = game.genetics.encode(strains[4]);
frames(5);
save('g2-breeding-ui');

// Almanac strains tab.
game.closeOverlay();
game.openOverlay('journal'); game.overlays.journalTab = 'almanac'; frames(5); save('g3-almanac-strains');

console.log('strain names:', strains.map((s) => s.name).join(', '));
console.log('done');
process.exit(0);
