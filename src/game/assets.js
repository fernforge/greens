// Builds and caches every sprite the game needs from the procedural generators
// and the data tables. Call Assets.build() once at boot (it reports progress).
import * as G from '../engine/spritegen.js';
import { makeCanvas } from '../engine/pixel.js';
import { CROPS } from './data/crops.js';
import { ITEMS } from './data/items.js';
import { ENEMIES } from './data/enemies.js';
import { NPCS } from './data/npcs.js';

export const Assets = {
  tiles: {},
  water: [],
  crops: {},     // cropId -> [stage canvases]
  trees: {},     // season -> canvas
  stump: null,
  rocks: {},     // key -> canvas
  bushes: {},
  weeds: [],
  forage: {},    // forageKind -> canvas
  enemies: {},
  icons: {},     // itemId -> 16x16 canvas
  player: null,  // direction frames (default palette)
  npcs: {},      // npcId -> direction frames
  buildings: {},
  ready: false,

  async build(onProgress) {
    const steps = [];
    const P = (label, fn) => steps.push([label, fn]);

    P('Tilling soil', () => {
      const tileTypes = ['grass', 'grass_dark', 'grass_spring', 'grass_summer', 'grass_fall', 'grass_winter',
        'dirt', 'soil', 'soil_wet', 'path', 'stone_floor', 'wood_floor', 'sand', 'water_deep',
        'rock_floor', 'cave_floor', 'planks', 'rug'];
      let seed = 7;
      for (const t of tileTypes) this.tiles[t] = G.genTile(t, seed++);
      this.water = G.genWaterAnim(101);
    });

    P('Planting greens', () => {
      for (const c of CROPS) this.crops[c.id] = G.genCrop({ ...c, stages: c.stages || 5 });
    });

    P('Growing trees', () => {
      for (const s of ['spring', 'summer', 'fall', 'winter']) this.trees[s] = G.genTree(s, 21);
      this.trees2 = {};
      for (const s of ['spring', 'summer', 'fall', 'winter']) this.trees2[s] = G.genTree(s, 57);
      this.stump = G.genStump(3);
    });

    P('Scattering rocks', () => {
      this.rocks.med = G.genRock('med', 5);
      this.rocks.big = G.genRock('big', 9);
      this.rocks.small = G.genRock('small', 13);
      for (const ore of ['copper', 'iron', 'gold', 'coal', 'gem', 'crystal']) this.rocks['ore_' + ore] = G.genRock('med', 30 + ore.length, ore);
      this.bushes.plain = G.genBush(false, 4);
      this.bushes.berry = G.genBush(true, 8);
      this.weeds = [G.genWeed(1), G.genWeed(2), G.genWeed(3)];
    });

    P('Hiding forage', () => {
      for (const k of ['branch', 'stone', 'mushroom', 'berry', 'flower', 'leek']) this.forage[k] = G.genForage(k, k.length * 5);
    });

    P('Waking monsters', () => {
      for (const [id, e] of Object.entries(ENEMIES)) this.enemies[id] = G.genEnemy(e.sprite, id.length * 7);
    });

    P('Carving sprites', () => {
      // Player default palette (customizable at new game)
      this.player = G.genCharacter(DEFAULT_PLAYER_PAL);
      for (const n of NPCS) this.npcs[n.id] = G.genCharacter(n.palette);
    });

    P('Forging items', () => {
      for (const [id, it] of Object.entries(ITEMS)) this.icons[id] = this.makeIcon(it);
    });

    P('Raising buildings', () => {
      this.buildings.house = G.genHouse(1);
      this.buildings.shop = G.genShopBuilding(2);
    });

    for (let i = 0; i < steps.length; i++) {
      const [label, fn] = steps[i];
      fn();
      if (onProgress) onProgress((i + 1) / steps.length, label);
      // yield to the browser so the loading bar paints
      await new Promise((r) => setTimeout(r, 0));
    }
    this.ready = true;
  },

  makeIcon(it) {
    switch (it.iconKind) {
      case 'tool': return G.genTool(it.tool);
      case 'seed': return G.genSeedPacket(it.seedColor || '#7cc04f');
      case 'produce': return G.genProduce(it.produce);
      case 'fish': return G.genFish(it.fishSpec || {});
      case 'material': return this.materialIcon(it.id);
      case 'forage': return G.genForage(it.forageKind || 'berry', it.id.length * 3);
      case 'food': return G.genFood(it.foodSpec || {});
      default: return G.genIcon('#ccc');
    }
  },

  materialIcon(id) {
    const known = ['wood', 'stone', 'fiber', 'clay', 'copper', 'iron', 'gold', 'coal', 'gem', 'crystal', 'sap', 'honey', 'egg', 'milk', 'wool'];
    if (known.includes(id)) return G.genMaterial(id);
    if (id.endsWith('_bar')) return G.genMaterial(id.replace('_bar', ''));
    if (id === 'hardwood') return G.genMaterial('wood');
    // crafted/placeable fallbacks
    const map = { chest: '#8a5a2e', scarecrow: '#c8a85a', sprinkler: '#8aa0c0', fence: '#9c7142', gate: '#9c7142', torch: '#e8a82e', fertilizer: '#5a7a3a', stone_path: '#9aa0a8', recall_charm: '#b59cff' };
    return G.genIcon(map[id] || '#ccc');
  },

  icon(id) { return this.icons[id] || this.icons.__fallback || (this.icons.__fallback = G.genIcon('#888')); },
  cropStages(id) { return this.crops[id]; },

  // Return a hue-rotated (+ optional saturation boost) copy of a canvas. Used so
  // engineered crop strains visibly differ in colour with zero new art.
  tintCanvas(src, hueDeg, satBoost = 1.12) {
    const c = makeCanvas(src.width, src.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      const nh = (h + hueDeg / 360 + 1) % 1;
      const ns = Math.min(1, s * satBoost);
      const [r, g, b] = hsl2rgb(nh, ns, l);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  },

  // Build & cache the sprites for an engineered strain from its base crop's art.
  // strain: { id, base, genes:{hue} }
  buildStrainSprites(strain) {
    const hue = strain.genes.hue || 0;
    const key = 'st_' + strain.id;
    if (!this.crops[key]) {
      const baseStages = this.crops[strain.base] || [];
      this.crops[key] = baseStages.map((s) => this.tintCanvas(s, hue));
    }
    const seedId = 'st_seed_' + strain.id, cropId = 'st_crop_' + strain.id;
    if (!this.icons[cropId]) this.icons[cropId] = this.tintCanvas(this.icon(strain.base), hue);
    if (!this.icons[seedId]) this.icons[seedId] = this.tintCanvas(this.icon(strain.base + '_seed'), hue);
  },
  strainStageKey(id) { return 'st_' + id; },
};

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const dd = mx - mn;
    s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    if (mx === r) h = (g - b) / dd + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / dd + 2;
    else h = (r - g) / dd + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hsl2rgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const DEFAULT_PLAYER_PAL = {
  skin: '#e8b888', hair: '#5a3a1a', hair2: '#46300f',
  shirt: '#4f9c4f', shirt2: '#3a7a3a', pants: '#3a5a8c', shoes: '#5a3a22', hat: null,
};

// Palette presets offered at character creation.
export const PLAYER_PRESETS = [
  { name: 'Sage', pal: { skin: '#e8b888', hair: '#5a3a1a', shirt: '#4f9c4f', shirt2: '#3a7a3a', pants: '#3a5a8c', shoes: '#5a3a22' } },
  { name: 'Clover', pal: { skin: '#caa078', hair: '#2a1a14', shirt: '#9c3b5a', shirt2: '#7c2c46', pants: '#3a3a44', shoes: '#3a2a1c' } },
  { name: 'Birch', pal: { skin: '#f0d0b0', hair: '#c8a030', shirt: '#3a7a9c', shirt2: '#2c5c78', pants: '#5a4a3a', shoes: '#3a2a1c' } },
  { name: 'Fern', pal: { skin: '#a87850', hair: '#1a1a1a', shirt: '#6a5ab0', shirt2: '#4c3e8c', pants: '#3a4a3a', shoes: '#2a2a30' } },
  { name: 'Poppy', pal: { skin: '#e8c0a0', hair: '#b04030', shirt: '#e08a2e', shirt2: '#c06a1e', pants: '#3a3a44', shoes: '#3a2a1c' } },
  { name: 'Ash', pal: { skin: '#c89868', hair: '#8a8a92', shirt: '#5a5a64', shirt2: '#42424a', pants: '#2a2a30', shoes: '#1a1a20' } },
];

export function buildPlayerSprites(pal) {
  Assets.player = G.genCharacter(pal);
  return Assets.player;
}
