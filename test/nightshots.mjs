// Focused capture of night + cave lighting for inspection.
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('test/shots', { recursive: true });

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
await Assets.build(() => {});

const canvas = createCanvas(480, 270);
canvas.style = {}; canvas.addEventListener = () => {}; canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 270 });
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const game = new Game(renderer, input, new Audio());
const save = (n) => { writeFileSync(`test/shots/${n}.png`, canvas.toBuffer('image/png')); console.log('saved ' + n); };
const frames = (n) => { for (let i = 0; i < n; i++) { game.update(1 / 60); game.render(); input.endFrame(); } };

game.startNewGame({ playerName: 'Sage', farmName: 'Green', palette: undefined });
frames(20);

// Farm at dusk, evening, deep night
for (const [label, min] of [['n1-2000', 20 * 60], ['n2-2200', 22 * 60], ['n3-0030', 24.5 * 60]]) {
  game.gs.time.minute = min; frames(8); save(label);
  const ctx = canvas.getContext('2d');
  const corner = ctx.getImageData(20, 200, 1, 1).data;
  const mid = ctx.getImageData(240, 135, 1, 1).data;
  console.log(`DEBUG ${label}: corner=(${corner[0]},${corner[1]},${corner[2]}) center=(${mid[0]},${mid[1]},${mid[2]})`);
}
// Place a torch near the player on the farm to test light cutout at night
{
  const area = game.gs.currentArea();
  const ptx = game.player.tileX, pty = game.player.tileY;
  area.addObject({ type: 'torch', tx: ptx + 2, ty: pty, fw: 1, fh: 1 });
  game.gs.time.minute = 23 * 60; frames(8); save('n4-torch');
}
// Cave: mine entrance + a mine level
game.warpTo('mine_entrance', 9, 8); frames(30); save('c1-mine-entrance');
game.warpTo('mine_1', 0, 0); frames(40); save('c2-mine-level');
{
  const p = game.player, r = renderer;
  console.log(`DEBUG cave: player.cx=${p.cx} feetY=${p.feetY} | cam.x=${r.cam.x.toFixed(1)} cam.y=${r.cam.y.toFixed(1)} rx=${r.cam.rx} ry=${r.cam.ry}`);
  console.log(`DEBUG cave: player screen=(${r.sx(p.cx)}, ${r.sy(p.feetY)}) canvas=${r.W}x${r.H} area=${game.gs.currentArea().w}x${game.gs.currentArea().h} px=${game.gs.currentArea().pxW}x${game.gs.currentArea().pxH}`);
}
// place a torch in the mine
{
  const area = game.gs.currentArea();
  area.addObject({ type: 'torch', tx: (area.entryTx || 5) + 2, ty: (area.entryTy || 5), fw: 1, fh: 1 });
  frames(10); save('c3-mine-torch');
}
console.log('done');
process.exit(0);
