// Boot: build assets, wire engine + game, run the loop. Pixel-perfect scaling.
import { Renderer } from './engine/renderer.js';
import { Input } from './engine/input.js';
import { Loop } from './engine/loop.js';
import { Audio } from './engine/audio.js';
import { Assets } from './game/assets.js';
import { Game } from './game/game.js';
import { SaveManager } from './engine/save.js';

const canvas = document.getElementById('game');
const loadingEl = document.getElementById('loading');
const fillEl = document.getElementById('loadfill');
const tipEl = document.getElementById('loadtip');

const TIPS = [
  'Just press Space — Smart Tool picks the right tool for what you face.',
  'The prompt above an object shows the action and tool it needs.',
  'Press Esc → Help anytime for the full controls.',
  'Water your crops daily — rain does it for you!',
  'Sleep before 2 AM or you\'ll pass out.',
  'Talk to villagers and bring gifts to befriend them.',
  'The mine gets richer (and deadlier) the deeper you go.',
  'Ship crops in the bin by your house to earn gold overnight.',
  'Foraging, fishing, and mining all raise separate skills.',
  'Some crops keep producing after the first harvest!',
];
tipEl.textContent = TIPS[(Math.random() * TIPS.length) | 0];

const renderer = new Renderer(canvas);
const input = new Input(canvas);
const audio = new Audio();

// Responsive integer scaling: fit canvas to the window keeping aspect.
function resize() {
  const aspect = renderer.W / renderer.H;
  let w = window.innerWidth, h = window.innerHeight;
  if (w / h > aspect) w = Math.floor(h * aspect); else h = Math.floor(w / aspect);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();

const game = new Game(renderer, input, audio);

async function boot() {
  await Assets.build((frac, label) => {
    fillEl.style.width = Math.round(frac * 100) + '%';
    tipEl.textContent = label + '…';
  });

  // apply saved settings
  const s = SaveManager.loadSettings();
  if (s.muteMusic) audio.musicVol = 0;
  if (s.muteSfx) audio.sfxVol = 0;

  loadingEl.classList.add('hidden');

  const loop = new Loop(
    (dt) => game.update(dt),
    () => { game.render(); input.endFrame(); },
  );
  loop.start();

  // expose for debugging
  window.__greens = { game, renderer, audio, Assets };
}

boot().catch((err) => {
  console.error(err);
  tipEl.textContent = 'Error: ' + err.message;
  tipEl.style.color = '#e85f5f';
});
