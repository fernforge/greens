// Crop genetics & breeding — the signature mechanic (Phase 0 prototype).
// Strains are variants of a base crop carrying genes (colour hue, yield, growth
// speed, value, hardiness). Cross-breed two seeds to engineer a new strain whose
// traits are *visible* (the sprite is hue-shifted) and shareable as a seed code.
import { CROPS, CROP_BY_ID } from '../data/crops.js';
import { ITEMS } from '../data/items.js';
import { Assets } from '../assets.js';

export const GENE_KEYS = ['hue', 'yield', 'speed', 'value', 'hardiness'];

export function baseGenes() { return { hue: 0, yield: 0, speed: 0, value: 1, hardiness: 0 }; }

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const COLOR_WORDS = ['Verdant', 'Crimson', 'Amber', 'Golden', 'Jade', 'Teal', 'Cerulean', 'Violet', 'Magenta', 'Rosy'];
const TRAIT_WORDS = { value: ['Gilded', 'Royal', 'Prized'], yield: ['Bountiful', 'Lush', 'Abundant'], speed: ['Swift', 'Quick', 'Hasty'], hardiness: ['Hardy', 'Ironleaf', 'Stoneroot'] };

export class Genetics {
  constructor(game) { this.game = game; }
  get gs() { return this.game.gs; }
  get rng() { return this.game.rng; }

  strain(id) { return this.gs.strains[id]; }
  all() { return Object.values(this.gs.strains); }

  // Genes for any seed item (base crop seeds = neutral genes).
  genesOf(itemId) {
    const def = ITEMS[itemId];
    if (!def) return null;
    if (def.strainId && this.gs.strains[def.strainId]) return { ...this.gs.strains[def.strainId].genes };
    if (def.cropId) return baseGenes();
    return null;
  }
  baseOf(itemId) { const d = ITEMS[itemId]; return d && d.cropId; }

  // Predict the offspring genes/base of crossing two seeds (deterministic-ish; for
  // the live preview we pass a fresh sample each call via the game rng).
  cross(itemA, itemB) {
    const ga = this.genesOf(itemA), gb = this.genesOf(itemB);
    const ba = this.baseOf(itemA), bb = this.baseOf(itemB);
    if (!ga || !gb || !ba || !bb) return null;
    const r = this.rng;
    const base = r.bool() ? ba : bb;
    const hybrid = ba !== bb;
    const mut = (v, lo, hi, jitterLo, jitterHi, bigChance, big) => {
      let n = (v) + r.range(jitterLo, jitterHi);
      if (r.bool(bigChance)) n += r.range(-big, big);
      return clamp(n, lo, hi);
    };
    const avg = (a, b) => (a + b) / 2;
    const genes = {
      hue: clamp(Math.round(avg(ga.hue, gb.hue) + r.range(-22, 22) + (r.bool(0.18) ? r.range(-60, 60) : 0)), -180, 180),
      yield: +mut(avg(ga.yield, gb.yield), 0, 4, -0.2, 0.45, 0.15, 1).toFixed(2),
      speed: +mut(avg(ga.speed, gb.speed), 0, 0.5, -0.04, 0.07, 0.15, 0.12).toFixed(3),
      value: +mut(avg(ga.value, gb.value), 1, 3.2, -0.08, 0.22, 0.18, 0.4).toFixed(2),
      hardiness: +mut(avg(ga.hardiness, gb.hardiness), 0, 1, -0.08, 0.13, 0.12, 0.25).toFixed(2),
    };
    if (hybrid) genes.hue = clamp(genes.hue + r.range(-40, 40), -180, 180);
    return { base, genes, hybrid };
  }

  // Deterministic average for the live offspring preview (no mutation noise).
  previewCross(itemA, itemB) {
    const ga = this.genesOf(itemA), gb = this.genesOf(itemB);
    const ba = this.baseOf(itemA), bb = this.baseOf(itemB);
    if (!ga || !gb || !ba || !bb) return null;
    const avg = (a, b) => (a + b) / 2;
    const genes = {
      hue: Math.round(avg(ga.hue, gb.hue)),
      yield: +avg(ga.yield, gb.yield).toFixed(2),
      speed: +avg(ga.speed, gb.speed).toFixed(3),
      value: +avg(ga.value, gb.value).toFixed(2),
      hardiness: +avg(ga.hardiness, gb.hardiness).toFixed(2),
    };
    return { base: ba, genes, hybrid: ba !== bb, name: this.nameFor(ba, genes) };
  }

  nameFor(base, genes) {
    const cn = CROP_BY_ID[base].name;
    // pick the standout trait
    const score = { value: (genes.value - 1) / 2.2, yield: genes.yield / 4, speed: genes.speed / 0.5, hardiness: genes.hardiness };
    let bestK = null, bestV = 0.34;
    for (const k in score) if (score[k] > bestV) { bestV = score[k]; bestK = k; }
    let word;
    if (bestK) word = this.rng.pick(TRAIT_WORDS[bestK]);
    else word = COLOR_WORDS[Math.floor(((genes.hue + 180) / 360) * COLOR_WORDS.length) % COLOR_WORDS.length];
    const total = score.value + score.yield + score.speed + score.hardiness;
    if (total > 2.4) return 'Ancient ' + cn;
    return `${word} ${cn}`;
  }

  // Create, register and return a new strain from base + genes.
  create(base, genes, gen = 1, name = null) {
    const id = String(this.gs.strainSeq++);
    const strain = { id, base, name: name || this.nameFor(base, genes), genes, gen };
    this.gs.strains[id] = strain;
    this.register(strain);
    return strain;
  }

  // Register a strain's items + sprites (idempotent; called on create and on load).
  register(strain) {
    const base = CROP_BY_ID[strain.base];
    if (!base) return;
    const seedId = 'st_seed_' + strain.id, cropId = 'st_crop_' + strain.id;
    const value = Math.round(base.sellPrice * strain.genes.value);
    if (!ITEMS[cropId]) {
      ITEMS[cropId] = {
        id: cropId, name: strain.name, type: 'crop', cropId: strain.base, strainId: strain.id,
        price: value, sellPrice: value, stack: 999, iconKind: 'produce', produce: base.produce,
        edible: { energy: Math.round(value * 0.5), health: Math.round(value * 0.2) },
        desc: `An engineered ${base.name.toLowerCase()} strain.`,
      };
    } else { ITEMS[cropId].sellPrice = value; ITEMS[cropId].price = value; }
    if (!ITEMS[seedId]) {
      ITEMS[seedId] = {
        id: seedId, name: strain.name + ' Seeds', type: 'seed', cropId: strain.base, strainId: strain.id,
        price: 0, sellPrice: Math.max(1, Math.floor(value * 0.3)), stack: 999, iconKind: 'seed',
        season: base.season, seedColor: base.produce.c, desc: strainDesc(strain, base),
      };
    }
    if (Assets.ready || Assets.crops[strain.base]) Assets.buildStrainSprites(strain);
  }

  registerAll() { for (const s of this.all()) this.register(s); }

  growDaysFor(strain, base) { return Math.max(1, Math.round(base.growDays * (1 - (strain.genes.speed || 0)))); }

  // --- seed-code sharing (zero backend) ---
  encode(strain) {
    const g = strain.genes;
    const bi = CROPS.findIndex((c) => c.id === strain.base);
    const parts = [bi, Math.round(g.hue) + 360, Math.round(g.yield * 10), Math.round(g.speed * 1000), Math.round(g.value * 100), Math.round(g.hardiness * 100)];
    return 'GRN1-' + parts.map((n) => Math.max(0, n).toString(36)).join('.');
  }
  decode(code) {
    if (!code || typeof code !== 'string') return null;
    code = code.trim();
    if (!code.startsWith('GRN1-')) return null;
    const parts = code.slice(5).split('.').map((s) => parseInt(s, 36));
    if (parts.length < 6 || parts.some((n) => Number.isNaN(n))) return null;
    const base = CROPS[parts[0]];
    if (!base) return null;
    return {
      base: base.id,
      genes: { hue: clamp(parts[1] - 360, -180, 180), yield: parts[2] / 10, speed: parts[3] / 1000, value: parts[4] / 100, hardiness: parts[5] / 100 },
    };
  }
  importCode(code) {
    const d = this.decode(code);
    if (!d) return null;
    // avoid dup: if an identical strain exists, reuse it
    const existing = this.all().find((s) => s.base === d.base && this.encode(s) === code);
    if (existing) return existing;
    return this.create(d.base, d.genes, 1);
  }
}

function strainDesc(strain, base) {
  const g = strain.genes;
  const bits = [];
  if (g.yield >= 0.5) bits.push(`+${g.yield.toFixed(1)} yield`);
  if (g.speed >= 0.05) bits.push(`${Math.round(g.speed * 100)}% faster`);
  if (g.value > 1.05) bits.push(`×${g.value.toFixed(2)} value`);
  if (g.hardiness >= 0.1) bits.push(`hardy`);
  return `Plant in ${base.season.map((s) => ['Spring', 'Summer', 'Fall', 'Winter'][s]).join('/')}. ${bits.join(', ') || 'A unique strain.'}`;
}
