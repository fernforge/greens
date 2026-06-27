// Procedural pixel-art sprite generators. Everything visual in Greens is drawn
// here at runtime — no external image assets. Generators are seeded so output
// is stable across runs.
import { Px, shade, mix } from './pixel.js';
import { RNG } from './rng.js';

export const TILE = 16;
export const CHAR_W = 16;
export const CHAR_H = 24;

// ---------------------------------------------------------------------------
// TILES (16x16)
// ---------------------------------------------------------------------------

function grassBase(p, seed, c1, c2, c3) {
  const r = new RNG(seed);
  p.rect(0, 0, 16, 16, c1);
  for (let i = 0; i < 60; i++) {
    const x = r.int(0, 15), y = r.int(0, 15);
    p.set(x, y, r.bool(0.5) ? c2 : c3);
  }
  // a few blades
  for (let i = 0; i < 6; i++) {
    const x = r.int(1, 14), y = r.int(2, 13);
    p.vline(x, y, 2, shade(c2, -0.1));
  }
  return p;
}

export function genTile(type, seed = 1) {
  const p = new Px(TILE, TILE);
  const r = new RNG(seed + (type.length || 1) * 7);
  switch (type) {
    case 'grass': grassBase(p, seed, '#5b9d3e', '#6cae44', '#4f8c36'); break;
    case 'grass_dark': grassBase(p, seed + 3, '#477f31', '#54923a', '#3d702b'); break;
    case 'grass_spring': grassBase(p, seed + 11, '#67ad44', '#7cc04f', '#58993a');
      for (let i = 0; i < 4; i++) p.set(r.int(1, 14), r.int(1, 14), r.pick(['#f2c1d8', '#ffe46b', '#fff'])); break;
    case 'grass_summer': grassBase(p, seed + 12, '#6aa83c', '#7dbb46', '#5b9433'); break;
    case 'grass_fall': grassBase(p, seed + 13, '#9c7d35', '#b5933f', '#85692c');
      for (let i = 0; i < 5; i++) p.set(r.int(0, 15), r.int(0, 15), r.pick(['#c8722e', '#d98b35', '#a85628'])); break;
    case 'grass_winter': {
      p.rect(0, 0, 16, 16, '#dfe9ef');
      for (let i = 0; i < 30; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#eef4f8' : '#cdd9e2');
      for (let i = 0; i < 4; i++) p.set(r.int(1, 14), r.int(1, 14), '#9fb3c2');
      break;
    }
    case 'dirt': {
      p.rect(0, 0, 16, 16, '#7a5836');
      for (let i = 0; i < 50; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#6b4c2e' : '#87633f');
      break;
    }
    case 'soil': { // tilled, dry
      p.rect(0, 0, 16, 16, '#6e4a2a');
      for (let y = 1; y < 16; y += 4) {
        p.hline(0, y, 16, '#5a3b21');
        p.hline(0, y + 1, 16, '#7c5630');
      }
      for (let i = 0; i < 20; i++) p.set(r.int(0, 15), r.int(0, 15), '#83603a');
      break;
    }
    case 'soil_wet': {
      p.rect(0, 0, 16, 16, '#3f2a18');
      for (let y = 1; y < 16; y += 4) {
        p.hline(0, y, 16, '#2f1f12');
        p.hline(0, y + 1, 16, '#4a3320');
      }
      for (let i = 0; i < 16; i++) p.set(r.int(0, 15), r.int(0, 15), '#523722');
      break;
    }
    case 'path': {
      p.rect(0, 0, 16, 16, '#b09a6e');
      for (let i = 0; i < 40; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#9c8860' : '#c2ad7e');
      p.rectO(0, 0, 16, 16, '#8f7c55');
      break;
    }
    case 'stone_floor': {
      p.rect(0, 0, 16, 16, '#8a8e96');
      // brick pattern
      for (let y = 0; y < 16; y += 8) {
        const off = (y / 8) % 2 ? 4 : 0;
        for (let x = -8 + off; x < 16; x += 8) p.rectO(x, y, 8, 8, '#70747c');
      }
      for (let i = 0; i < 14; i++) p.set(r.int(0, 15), r.int(0, 15), '#9aa0a8');
      break;
    }
    case 'wood_floor': {
      p.rect(0, 0, 16, 16, '#9c7142');
      for (let x = 0; x < 16; x += 8) p.vline(x, 0, 16, '#7c5732');
      for (let y = 0; y < 16; y += 5) {
        p.hline(0, y, 8, '#88602f');
        p.hline(8, y + 2, 8, '#88602f');
      }
      break;
    }
    case 'sand': {
      p.rect(0, 0, 16, 16, '#e2cf94');
      for (let i = 0; i < 40; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#d3bd7e' : '#eed9a0');
      break;
    }
    case 'water0':
    case 'water1':
    case 'water2': {
      const phase = +type.slice(-1);
      p.rect(0, 0, 16, 16, '#3f78c2');
      for (let i = 0; i < 26; i++) p.set(r.int(0, 15), r.int(0, 15), '#4e87cf');
      // animated highlight bands
      for (let y = (phase * 5) % 16; y < 16; y += 6) {
        for (let x = 0; x < 16; x += 4) p.hline((x + phase * 2) % 16, y, 2, '#7fb0e6');
      }
      break;
    }
    case 'water_deep': {
      p.rect(0, 0, 16, 16, '#2c5a99');
      for (let i = 0; i < 18; i++) p.set(r.int(0, 15), r.int(0, 15), '#26508a');
      break;
    }
    case 'rock_floor': {
      p.rect(0, 0, 16, 16, '#5a5560');
      for (let i = 0; i < 30; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#4c4853' : '#67626e');
      break;
    }
    case 'cave_floor': {
      p.rect(0, 0, 16, 16, '#3a3742');
      for (let i = 0; i < 30; i++) p.set(r.int(0, 15), r.int(0, 15), r.bool() ? '#322f39' : '#45414d');
      break;
    }
    case 'planks':
      p.rect(0, 0, 16, 16, '#caa15e');
      for (let y = 0; y < 16; y += 4) p.hline(0, y, 16, '#a8843f');
      break;
    case 'rug': {
      p.rect(0, 0, 16, 16, '#9c3b3b');
      p.rectO(1, 1, 14, 14, '#e0c060');
      p.rectO(3, 3, 10, 10, '#c95050');
      break;
    }
    default:
      p.rect(0, 0, 16, 16, '#ff00ff');
  }
  return p.el;
}

// ---------------------------------------------------------------------------
// CHARACTER GENERATOR (16x24), 4 directions x walk frames + a tool-use frame
// palette: { skin, hair, hair2, shirt, shirt2, pants, shoes, hat? }
// ---------------------------------------------------------------------------

function drawCharBody(p, dir, legPhase, pal, armSwing = 0) {
  // anchor: feet at y=23, body centered at x=8
  const skin = pal.skin, skinS = shade(pal.skin, -0.2);
  const hair = pal.hair, hairS = pal.hair2 || shade(pal.hair, -0.25);
  const shirt = pal.shirt, shirtS = pal.shirt2 || shade(pal.shirt, -0.2);
  const pants = pal.pants, pantsS = shade(pal.pants, -0.2);
  const shoes = pal.shoes || '#3a2a1c';

  // Legs (y 18..23) with phase offset
  const lx = 5, rx = 8;
  const ll = legPhase === 1 ? 1 : 0;
  const rl = legPhase === 2 ? 1 : 0;
  p.rect(lx, 18 - ll, 3, 5 + ll, pants);
  p.rect(rx, 18 - rl, 3, 5 + rl, pants);
  p.rect(lx, 22 - ll, 3, 1, shoes);
  p.rect(rx, 22 - rl, 3, 1, shoes);
  p.vline(lx, 18 - ll, 4, pantsS);
  p.vline(rx + 2, 18 - rl, 4, pantsS);

  // Torso (y 11..18)
  p.rect(4, 11, 8, 8, shirt);
  p.rect(4, 11, 1, 8, shirtS);
  p.rect(11, 11, 1, 8, shirtS);
  // belt
  p.hline(4, 17, 8, shade(pal.pants, -0.35));

  // Arms
  const aL = armSwing, aR = -armSwing;
  p.rect(3, 12 + aL, 2, 5, shirt);
  p.rect(11, 12 + aR, 2, 5, shirt);
  p.rect(3, 16 + aL, 2, 1, skin); // hands
  p.rect(11, 16 + aR, 2, 1, skin);

  // Head (y 4..11)
  if (dir === 'up') {
    p.rect(4, 4, 8, 7, hair);
    p.rect(4, 4, 8, 2, hairS);
    p.rect(4, 9, 8, 2, skin); // neck/back
  } else if (dir === 'left' || dir === 'right') {
    const flip = dir === 'left';
    const fx = (x) => (flip ? 15 - x : x);
    // face profile
    for (let y = 5; y < 11; y++) p.rect(Math.min(fx(4), fx(11)), y, 8, 1, skin);
    // hair top + back
    p.rect(4, 4, 8, 3, hair);
    p.set(fx(11), 5, hair); p.set(fx(11), 6, hair);
    // eye
    p.set(fx(10), 7, '#1b2233');
    // shade back
    p.vline(flip ? 11 : 4, 5, 6, skinS);
  } else { // down
    p.rect(4, 5, 8, 6, skin);
    p.rect(4, 4, 8, 3, hair);
    p.rect(4, 4, 1, 5, hairS);
    p.rect(11, 4, 1, 5, hairS);
    p.set(5, 4, hair); p.set(10, 4, hair);
    // eyes
    p.set(6, 8, '#1b2233'); p.set(9, 8, '#1b2233');
    // mouth
    p.set(7, 10, skinS); p.set(8, 10, skinS);
  }

  // Optional hat
  if (pal.hat) {
    p.rect(3, 3, 10, 2, pal.hat);
    p.rect(4, 1, 8, 3, pal.hat);
    p.rect(4, 1, 8, 1, shade(pal.hat, 0.2));
  }
}

export function genCharacter(pal, opts = {}) {
  const dirs = ['down', 'up', 'left', 'right'];
  const out = {};
  for (const dir of dirs) {
    const frames = [];
    // walk cycle: 0 idle, 1 step-left, 0 idle, 2 step-right
    const phases = [0, 1, 0, 2];
    for (let f = 0; f < 4; f++) {
      const p = new Px(CHAR_W, CHAR_H);
      const swing = phases[f] === 1 ? -1 : phases[f] === 2 ? 1 : 0;
      drawCharBody(p, dir === 'left' ? 'right' : dir, phases[f], pal, swing);
      p.outline('#1c2419');
      const el = p.el;
      frames.push(dir === 'left' ? flipCanvas(el) : el);
    }
    out[dir] = frames;
  }
  // action frame (tool raise) per direction — reuse idle with arms up
  out.action = {};
  for (const dir of dirs) {
    const p = new Px(CHAR_W, CHAR_H);
    drawCharBody(p, dir === 'left' ? 'right' : dir, 0, pal, 0);
    // raise both hands
    p.rect(11, 9, 2, 4, pal.shirt);
    p.rect(11, 8, 2, 1, pal.skin);
    p.outline('#1c2419');
    out.action[dir] = dir === 'left' ? flipCanvas(p.el) : p.el;
  }
  return out;
}

function flipCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(src.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

// ---------------------------------------------------------------------------
// CROPS — generated per growth stage from a palette.
// Returns array of canvases (one per stage). Stage 0 = seed/sprout.
// spec: { leaf, leaf2, fruit, fruit2, stem, stages, kind }
// kind: 'leafy' | 'fruit' | 'root' | 'flower' | 'stalk' | 'vine'
// ---------------------------------------------------------------------------

export function genCrop(spec) {
  const stages = spec.stages || 5;
  const out = [];
  const stem = spec.stem || '#3c7a2e';
  for (let s = 0; s < stages; s++) {
    const p = new Px(16, 20); // taller than tile; anchored at bottom (y=19)
    const t = s / (stages - 1);
    if (s === 0) {
      // sprout
      p.set(8, 18, '#5a3b21');
      p.vline(8, 15, 3, stem);
      p.set(7, 15, spec.leaf); p.set(9, 15, spec.leaf);
    } else {
      const h = Math.round(2 + t * 11);
      const baseY = 19;
      // stem
      p.rect(7, baseY - h, 2, h, stem);
      p.vline(7, baseY - h, h, shade(stem, -0.2));
      const top = baseY - h;
      if (spec.kind === 'leafy') {
        const lr = 1 + Math.round(t * 4);
        p.ellipse(8, top + lr, lr + 1, lr, spec.leaf);
        p.ellipse(8, top + lr, lr, lr - 1, spec.leaf2 || shade(spec.leaf, 0.12));
        if (s >= stages - 1 && spec.heart) p.ellipse(8, top + lr, 2, 2, spec.fruit || '#dff0a0');
      } else if (spec.kind === 'root') {
        // bushy top
        for (let i = 0; i < 4 + s * 2; i++) {
          const a = (i / (4 + s * 2)) * Math.PI - Math.PI;
          p.line(8, top, 8 + Math.cos(a) * (2 + t * 3), top - Math.abs(Math.sin(a)) * (2 + t * 4), spec.leaf);
        }
        if (s >= stages - 1) { p.ellipse(8, baseY - 2, 2, 2, spec.fruit || '#d2691e'); }
      } else if (spec.kind === 'fruit' || spec.kind === 'vine') {
        // leaves along stem
        for (let y = top + 1; y < baseY - 1; y += 3) {
          p.line(7, y, 4, y - 1, spec.leaf);
          p.line(9, y, 11, y - 1, spec.leaf);
        }
        p.ellipse(8, top, 2, 2, spec.leaf2 || spec.leaf);
        if (s >= stages - 2) {
          const fy = baseY - 4;
          p.circle(6, fy, 1 + s - (stages - 2), spec.fruit);
          p.circle(10, fy + 1, 1 + s - (stages - 2), spec.fruit);
          if (spec.fruit2) { p.set(6, fy - 1, spec.fruit2); p.set(10, fy, spec.fruit2); }
        }
      } else if (spec.kind === 'flower') {
        for (let y = top + 1; y < baseY - 1; y += 4) { p.line(7, y, 5, y - 1, spec.leaf); p.line(9, y, 11, y - 1, spec.leaf); }
        if (s >= stages - 2) {
          const cx = 8, cy = top;
          const petals = spec.fruit;
          p.set(cx, cy - 2, petals); p.set(cx, cy + 2, petals);
          p.set(cx - 2, cy, petals); p.set(cx + 2, cy, petals);
          p.set(cx - 1, cy - 1, petals); p.set(cx + 1, cy - 1, petals);
          p.set(cx - 1, cy + 1, petals); p.set(cx + 1, cy + 1, petals);
          p.set(cx, cy, spec.fruit2 || '#ffe46b');
        }
      } else if (spec.kind === 'stalk') {
        p.rect(7, top, 2, h, stem);
        for (let y = top; y < baseY; y += 2) { p.set(6, y, spec.leaf); p.set(9, y, spec.leaf); }
        if (s >= stages - 1) { p.rect(6, top - 1, 4, 4, spec.fruit); p.set(7, top, spec.fruit2 || '#ffe46b'); }
      }
    }
    p.outline('#23381c');
    out.push(p.el);
  }
  return out;
}

// ---------------------------------------------------------------------------
// WORLD OBJECTS: trees, rocks, bushes, stumps, weeds, forageables
// ---------------------------------------------------------------------------

export function genTree(season = 'spring', seed = 1) {
  const p = new Px(32, 44);
  const r = new RNG(seed);
  // trunk
  p.rect(13, 30, 6, 14, '#6b4a2a');
  p.rect(13, 30, 2, 14, '#553a20');
  p.rect(17, 30, 2, 14, '#7c5631');
  // canopy
  let c1 = '#3f8a36', c2 = '#4fa543', c3 = '#327029';
  if (season === 'fall') { c1 = '#c2772e'; c2 = '#d98f35'; c3 = '#9c5a26'; }
  if (season === 'winter') { c1 = '#7d8a72'; c2 = '#8fa080'; c3 = '#66735c'; }
  if (season === 'summer') { c1 = '#37892f'; c2 = '#46a23c'; c3 = '#2c6d24'; }
  const cx = 16;
  for (const [dx, dy, rr] of [[0, 14, 13], [-7, 18, 9], [7, 18, 9], [0, 22, 11]]) {
    p.circle(cx + dx, dy, rr, c1);
  }
  // dapple
  for (let i = 0; i < 70; i++) {
    const a = r.angle(), d = r.range(0, 12);
    const x = cx + Math.cos(a) * d, y = 17 + Math.sin(a) * d;
    p.set(x | 0, y | 0, r.bool(0.5) ? c2 : c3);
  }
  if (season === 'winter') {
    for (let i = 0; i < 20; i++) p.set(r.int(3, 28), r.int(4, 26), '#e8eef2');
  }
  p.outline('#1f3219');
  return p.el;
}

export function genStump(seed = 1) {
  const p = new Px(20, 18);
  p.rect(5, 8, 10, 8, '#6b4a2a');
  p.ellipse(10, 8, 6, 3, '#7c5631');
  p.ellipse(10, 8, 4, 2, '#8a6238');
  p.ellipse(10, 8, 2, 1, '#6b4a2a');
  p.outline('#1f3219');
  return p.el;
}

export function genRock(size = 'med', seed = 1, ore = null) {
  const w = size === 'big' ? 28 : size === 'small' ? 14 : 20;
  const h = Math.round(w * 0.8);
  const p = new Px(w, h);
  const r = new RNG(seed);
  const base = '#8b8790', lite = '#a4a0a9', dark = '#6c6873';
  p.ellipse(w / 2, h - 4, w / 2 - 1, h / 2 - 1, base);
  for (let i = 0; i < w; i++) p.set(r.int(2, w - 3), r.int(2, h - 3), r.bool() ? lite : dark);
  // top light
  p.ellipse(w / 2 - 2, h / 2 - 2, w / 4, h / 5, lite);
  if (ore) {
    const oc = { copper: '#c87a3a', iron: '#cfd2d6', gold: '#ffcf3f', coal: '#2c2c33', gem: '#7fd0ff', crystal: '#d89cff' }[ore] || '#fff';
    for (let i = 0; i < 5; i++) p.set(r.int(3, w - 4), r.int(3, h - 4), oc);
    p.set(w / 2 | 0, h / 2 | 0, oc);
  }
  p.outline('#3a3742');
  return p.el;
}

export function genBush(berries = false, seed = 1) {
  const p = new Px(22, 20);
  const r = new RNG(seed);
  for (const [dx, dy, rr] of [[0, 12, 8], [-6, 14, 6], [6, 14, 6]]) p.circle(11 + dx, dy, rr, '#3f8a36');
  for (let i = 0; i < 40; i++) p.set(r.int(2, 19), r.int(4, 18), r.bool() ? '#4fa543' : '#327029');
  if (berries) for (let i = 0; i < 6; i++) p.set(r.int(4, 17), r.int(6, 16), '#d23b4e');
  p.outline('#1f3219');
  return p.el;
}

export function genWeed(seed = 1) {
  const p = new Px(14, 14);
  const r = new RNG(seed);
  for (let i = 0; i < 5; i++) {
    const x = r.int(4, 9);
    p.line(7, 13, x, r.int(3, 8), r.pick(['#5b9d3e', '#6cae44', '#4f8c36']));
  }
  p.outline('#1f3219');
  return p.el;
}

export function genForage(kind, seed = 1) {
  const p = new Px(14, 12);
  const r = new RNG(seed);
  switch (kind) {
    case 'branch': p.line(2, 9, 11, 5, '#6b4a2a'); p.line(6, 7, 8, 3, '#6b4a2a'); break;
    case 'stone': p.ellipse(7, 8, 4, 3, '#8b8790'); p.ellipse(6, 7, 2, 1, '#a4a0a9'); break;
    case 'mushroom': p.rect(6, 7, 2, 4, '#e8e0cf'); p.ellipse(7, 6, 4, 2, '#c44'); for (let i = 0; i < 3; i++) p.set(r.int(4, 10), 5, '#fff'); break;
    case 'berry': for (let i = 0; i < 4; i++) p.circle(r.int(4, 10), r.int(5, 9), 1, '#7a3bd2'); break;
    case 'flower': p.vline(7, 7, 4, '#4f8c36'); p.circle(7, 5, 2, r.pick(['#f2c1d8', '#ffe46b', '#b59cff'])); p.set(7, 5, '#fff'); break;
    case 'leek': p.line(7, 11, 5, 3, '#6cae44'); p.line(7, 11, 9, 4, '#6cae44'); p.rect(6, 9, 2, 2, '#eef'); break;
    default: p.circle(7, 7, 3, '#fff');
  }
  p.outline('#1f3219');
  return p.el;
}

// ---------------------------------------------------------------------------
// ENEMIES
// ---------------------------------------------------------------------------

export function genEnemy(type, seed = 1) {
  const p = new Px(18, 18);
  const r = new RNG(seed);
  switch (type) {
    case 'slime': {
      const c = '#5fbf6a';
      p.ellipse(9, 12, 7, 5, c);
      p.rect(2, 12, 14, 4, c);
      p.set(6, 10, '#1b2233'); p.set(11, 10, '#1b2233');
      p.ellipse(7, 9, 3, 2, shade(c, 0.25));
      break;
    }
    case 'slime_blue': { const c = '#5b8fdf'; p.ellipse(9, 12, 7, 5, c); p.rect(2, 12, 14, 4, c); p.set(6, 10, '#fff'); p.set(11, 10, '#fff'); break; }
    case 'slime_red': { const c = '#df5b5b'; p.ellipse(9, 12, 7, 5, c); p.rect(2, 12, 14, 4, c); p.set(6, 10, '#1b2233'); p.set(11, 10, '#1b2233'); break; }
    case 'bat': {
      p.ellipse(9, 9, 3, 3, '#4a3b55');
      p.line(6, 9, 1, 6, '#5e4d6b'); p.line(12, 9, 17, 6, '#5e4d6b');
      p.line(6, 9, 2, 11, '#5e4d6b'); p.line(12, 9, 16, 11, '#5e4d6b');
      p.set(8, 8, '#ff5'); p.set(10, 8, '#ff5');
      break;
    }
    case 'bug': {
      p.ellipse(9, 10, 5, 4, '#7a5a2e');
      p.rect(8, 6, 2, 3, '#5a3b21');
      for (let i = 0; i < 3; i++) { p.line(4, 9 + i, 1, 7 + i, '#3a2a1c'); p.line(14, 9 + i, 17, 7 + i, '#3a2a1c'); }
      break;
    }
    case 'ghost': {
      p.ellipse(9, 8, 5, 5, '#dfe6f0');
      p.rect(4, 8, 10, 6, '#dfe6f0');
      for (let x = 4; x < 14; x += 3) p.set(x, 14, '#dfe6f0');
      p.set(7, 7, '#1b2233'); p.set(11, 7, '#1b2233');
      break;
    }
    case 'golem': {
      p.rect(4, 4, 10, 12, '#7a6f63');
      p.rect(4, 4, 10, 3, '#8c8174');
      p.set(6, 8, '#ff5'); p.set(11, 8, '#ff5');
      p.rect(3, 7, 1, 5, '#5c5249'); p.rect(14, 7, 1, 5, '#5c5249');
      break;
    }
    default: p.circle(9, 9, 5, '#f0f');
  }
  p.outline('#1b2233');
  return p.el;
}

// ---------------------------------------------------------------------------
// ITEM ICONS (16x16) — tools, seeds, produce, materials, food, fish
// ---------------------------------------------------------------------------

export function genTool(kind) {
  const p = new Px(16, 16);
  const handle = '#8a5a2e', handleS = '#6e4623';
  switch (kind) {
    case 'hoe':
      p.line(4, 13, 11, 4, handle); p.line(4, 14, 11, 5, handleS);
      p.rect(10, 3, 4, 2, '#c9ccd2'); p.rect(12, 3, 2, 4, '#c9ccd2');
      break;
    case 'wateringcan':
      p.rect(4, 7, 7, 6, '#4a8fd0'); p.rect(4, 6, 7, 1, '#5fa0e0');
      p.rect(10, 8, 4, 2, '#4a8fd0'); // spout
      p.rect(13, 7, 1, 2, '#5fa0e0');
      p.rect(5, 5, 5, 1, '#3a7ab8');
      p.rect(11, 6, 2, 1, '#3a7ab8');
      break;
    case 'axe':
      p.line(5, 13, 10, 4, handle); p.line(5, 14, 10, 5, handleS);
      p.rect(9, 2, 5, 5, '#c9ccd2'); p.rect(9, 2, 2, 5, '#e2e5ea');
      break;
    case 'pickaxe':
      p.line(5, 13, 8, 5, handle); p.line(5, 14, 8, 6, handleS);
      p.line(3, 4, 13, 4, '#c9ccd2'); p.line(3, 5, 13, 5, '#a8abb2');
      p.set(3, 3, '#c9ccd2'); p.set(13, 3, '#c9ccd2');
      break;
    case 'scythe':
      p.line(5, 14, 9, 4, handle);
      p.line(9, 4, 3, 6, '#c9ccd2'); p.line(9, 5, 4, 8, '#a8abb2');
      break;
    case 'sword':
      p.line(5, 13, 12, 4, '#d6dae0'); p.line(6, 13, 12, 5, '#b0b4ba');
      p.line(4, 11, 7, 14, '#8a5a2e');
      p.set(12, 3, '#fff');
      break;
    case 'fishingrod':
      p.line(3, 14, 12, 3, handle);
      p.line(12, 3, 13, 11, '#cfd6df'); // line
      p.rect(12, 10, 2, 2, '#d23b4e'); // bobber
      break;
    case 'watering_pip':
      p.rect(6, 6, 4, 6, '#4a8fd0'); break;
    default:
      p.rect(4, 4, 8, 8, '#ccc');
  }
  p.outline('#1b2233');
  return p.el;
}

export function genSeedPacket(color) {
  const p = new Px(16, 16);
  p.rect(4, 3, 8, 11, '#d8c79a');
  p.rect(4, 3, 8, 11, '#d8c79a');
  p.rectO(4, 3, 8, 11, '#a8966a');
  p.circle(8, 8, 2, color);
  p.set(8, 8, shade(color, 0.3));
  p.hline(5, 5, 6, '#a8966a');
  p.outline('#1b2233');
  return p.el;
}

export function genProduce(spec) {
  // spec: { shape:'round'|'long'|'leafy'|'cluster'|'head', c, c2 }
  const p = new Px(16, 16);
  const c = spec.c, c2 = spec.c2 || shade(c, 0.22), cd = shade(c, -0.25);
  switch (spec.shape) {
    case 'round':
      p.circle(8, 9, 5, c); p.ellipse(6, 7, 2, 1, c2);
      p.vline(8, 2, 3, '#4f8c36'); p.set(7, 3, '#6cae44');
      break;
    case 'long':
      p.rect(6, 4, 4, 10, c); p.ellipse(8, 13, 2, 1, c);
      p.vline(6, 4, 9, c2);
      p.line(8, 4, 8, 1, '#4f8c36'); p.set(7, 2, '#6cae44'); p.set(9, 2, '#6cae44');
      break;
    case 'leafy':
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI - Math.PI; p.line(8, 12, 8 + Math.cos(a) * 6, 12 - Math.abs(Math.sin(a)) * 8, c); }
      p.ellipse(8, 11, 4, 3, c2);
      break;
    case 'head':
      p.circle(8, 9, 6, c); p.ellipse(8, 8, 4, 3, c2);
      for (let i = 0; i < 8; i++) p.set(4 + (i % 4) * 3, 5 + ((i / 4) | 0) * 3, cd);
      break;
    case 'cluster':
      for (const [x, y] of [[6, 8], [10, 8], [8, 11], [6, 12], [10, 12]]) p.circle(x, y, 2, c);
      p.vline(8, 3, 4, '#4f8c36');
      break;
    default:
      p.circle(8, 8, 5, c);
  }
  p.outline('#1b2233');
  return p.el;
}

export function genFish(spec) {
  const p = new Px(16, 16);
  const c = spec.c || '#6aa0d0', c2 = spec.c2 || shade(c, 0.25);
  p.ellipse(8, 8, 5, 3, c);
  p.ellipse(7, 7, 3, 1, c2);
  // tail
  p.line(13, 8, 15, 5, c); p.line(13, 8, 15, 11, c); p.line(15, 5, 15, 11, c);
  p.set(4, 7, '#1b2233'); // eye
  p.outline('#1b2233');
  return p.el;
}

export function genMaterial(kind) {
  const p = new Px(16, 16);
  const r = new RNG(kind.length * 13 + 3);
  switch (kind) {
    case 'wood': p.rect(4, 6, 9, 4, '#9c7142'); p.ellipse(4, 8, 2, 2, '#caa15e'); p.ellipse(13, 8, 2, 2, '#caa15e'); p.set(4, 8, '#7c5732'); break;
    case 'stone': p.ellipse(8, 9, 5, 4, '#8b8790'); p.ellipse(6, 7, 2, 1, '#a4a0a9'); break;
    case 'fiber': for (let i = 0; i < 6; i++) p.line(8, 13, r.int(3, 12), r.int(3, 7), '#9cae5a'); break;
    case 'clay': p.ellipse(8, 9, 5, 3, '#c87a5a'); p.ellipse(6, 8, 2, 1, '#d98f6a'); break;
    case 'copper': p.ellipse(8, 9, 4, 3, '#c87a3a'); p.set(6, 8, '#e89a5a'); break;
    case 'iron': p.ellipse(8, 9, 4, 3, '#cfd2d6'); p.set(6, 8, '#eef'); break;
    case 'gold': p.ellipse(8, 9, 4, 3, '#ffcf3f'); p.set(6, 8, '#fff0a0'); break;
    case 'coal': p.ellipse(8, 9, 4, 3, '#2c2c33'); p.set(6, 8, '#4c4853'); break;
    case 'gem': p.rect(6, 5, 4, 4, '#7fd0ff'); p.rect(5, 9, 6, 3, '#7fd0ff'); p.set(7, 6, '#dff4ff'); break;
    case 'crystal': p.rect(7, 4, 2, 8, '#d89cff'); p.rect(6, 6, 4, 4, '#d89cff'); p.set(7, 6, '#fff'); break;
    case 'sap': p.ellipse(8, 9, 3, 3, '#b5762e'); break;
    case 'honey': p.rect(6, 5, 5, 7, '#e8a82e'); p.rect(6, 5, 5, 2, '#f0c14e'); break;
    case 'egg': p.ellipse(8, 9, 3, 4, '#f4ecd8'); p.ellipse(7, 7, 1, 2, '#fff'); break;
    case 'milk': p.rect(6, 4, 5, 9, '#eef'); p.rect(6, 4, 5, 2, '#fff'); p.rect(7, 6, 3, 2, '#9cf'); break;
    case 'wool': p.circle(8, 9, 4, '#f4f0e8'); p.set(6, 8, '#fff'); p.set(10, 9, '#dde'); break;
    default: p.circle(8, 8, 4, '#fff');
  }
  p.outline('#1b2233');
  return p.el;
}

export function genFood(spec) {
  const p = new Px(16, 16);
  const c = spec.c || '#d98f35';
  switch (spec.shape) {
    case 'plate':
      p.ellipse(8, 11, 6, 2, '#dfe6f0'); p.ellipse(8, 9, 4, 3, c); break;
    case 'bowl':
      p.ellipse(8, 9, 5, 3, c); p.rect(3, 9, 10, 3, '#dfe6f0'); p.ellipse(8, 12, 5, 1, '#c0c8d2'); break;
    case 'drink':
      p.rect(6, 4, 4, 9, '#9cf'); p.rect(6, 4, 4, 2, c); break;
    case 'baked':
      p.ellipse(8, 9, 5, 3, '#caa15e'); p.ellipse(8, 8, 3, 2, c); break;
    default: p.ellipse(8, 9, 5, 3, c);
  }
  p.outline('#1b2233');
  return p.el;
}

// Generic colored icon fallback
export function genIcon(color, glyph) {
  const p = new Px(16, 16);
  p.circle(8, 8, 6, color);
  p.outline('#1b2233');
  return p.el;
}

// ---------------------------------------------------------------------------
// FX / decorations
// ---------------------------------------------------------------------------
export function genHouse(seed = 1) {
  const p = new Px(64, 56);
  // body
  p.rect(6, 22, 52, 32, '#caa15e');
  for (let y = 24; y < 54; y += 4) p.hline(6, y, 52, '#a8843f');
  // roof
  for (let i = 0; i < 26; i++) p.rect(6 + i, 22 - i * 0.7, 52 - i * 2, 2, '#9c3b3b');
  p.rect(2, 20, 60, 4, '#7c2e2e');
  // door
  p.rect(28, 40, 10, 14, '#6b4a2a'); p.rect(28, 40, 10, 14, '#6b4a2a');
  p.rectO(28, 40, 10, 14, '#553a20'); p.set(36, 47, '#ffcf3f');
  // windows
  p.rect(14, 32, 8, 8, '#bfe0f0'); p.rectO(14, 32, 8, 8, '#7c5732'); p.line(18, 32, 18, 39, '#7c5732');
  p.rect(44, 32, 8, 8, '#bfe0f0'); p.rectO(44, 32, 8, 8, '#7c5732'); p.line(48, 32, 48, 39, '#7c5732');
  // chimney
  p.rect(46, 4, 6, 14, '#8b5a3a');
  p.outline('#3a2a1c');
  return p.el;
}

export function genShopBuilding(seed = 1) {
  const p = new Px(72, 60);
  p.rect(4, 24, 64, 34, '#b58a5a');
  for (let y = 26; y < 58; y += 4) p.hline(4, y, 64, '#946e44');
  for (let i = 0; i < 30; i++) p.rect(4 + i, 24 - i * 0.6, 64 - i * 2, 2, '#3a7a4f');
  p.rect(0, 22, 72, 4, '#2c5c3c');
  // big window + awning
  p.rect(10, 34, 22, 16, '#bfe0f0'); p.rectO(10, 34, 22, 16, '#7c5732');
  for (let x = 8; x < 36; x += 6) p.rect(x, 30, 3, 4, '#d23b4e');
  for (let x = 11; x < 36; x += 6) p.rect(x, 30, 3, 4, '#f0ead8');
  // door
  p.rect(44, 40, 12, 18, '#6b4a2a'); p.rectO(44, 40, 12, 18, '#553a20'); p.set(54, 49, '#ffcf3f');
  p.outline('#3a2a1c');
  return p.el;
}

export function genWaterAnim(seed = 1) {
  return [genTile('water0', seed), genTile('water1', seed), genTile('water2', seed)];
}
