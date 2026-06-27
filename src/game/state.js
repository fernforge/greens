// Central game state: the single source of truth that gets saved & loaded.
import { TimeSystem } from './systems/time.js';
import { Inventory } from './systems/inventory.js';
import { Skills } from './systems/skills.js';
import { generateWorld } from './world/mapgen.js';
import { Area } from './world/world.js';
import { NPCS } from './data/npcs.js';
import { QUESTS, QUEST_BY_ID } from './data/quests.js';
import { DEFAULT_PLAYER_PAL } from './assets.js';
import { TILE } from '../engine/spritegen.js';

export class GameState {
  constructor() {
    this.seed = 12345;
    this.player = null;
    this.time = new TimeSystem();
    this.inv = new Inventory();
    this.skills = new Skills();
    this.relationships = {};
    this.quests = { active: [], done: [], progress: {} };
    this.stats = { shipTotal: 0, goldEarned: 0, fishCaught: [], foraged: [], kills: 0, deepestMine: 0, daysPlayed: 1, cropsHarvested: 0, itemsCooked: 0, cropsSeen: [], mineralsSeen: [], cooked: [] };
    this.flags = {};
    this.areas = {};
    this.mineLevels = {};       // depth -> Area (transient)
    this.shippingBin = [];      // items placed in bin, sold at day end: [{id,count}]
    this.meta = { farmName: 'Green', playerName: 'Sage', playtime: 0, savedAt: 0 };
    this.recipesKnown = [];     // unlocked recipe ids
    this.strains = {};          // engineered crop strains: id -> {base,name,genes,gen}
    this.strainSeq = 1;
  }

  newGame(opts) {
    this.seed = (Math.floor(Math.random() * 1e9)) >>> 0;
    this.meta.farmName = opts.farmName || 'Green';
    this.meta.playerName = opts.playerName || 'Sage';
    this.areas = generateWorld(this.seed);
    this.player = {
      name: this.meta.playerName, palette: opts.palette || DEFAULT_PLAYER_PAL,
      area: 'farm', x: 23 * TILE, y: 10 * TILE, dir: 'down',
      energy: 270, maxEnergy: 270, health: 100, maxHealth: 100, gold: 500,
      toolLevels: { hoe: 0, wateringcan: 0, axe: 0, pickaxe: 0, scythe: 0, sword: 0, fishingrod: 0 },
    };
    // Starter inventory
    this.inv.add('hoe', 1); this.inv.add('wateringcan', 1); this.inv.add('axe', 1);
    this.inv.add('pickaxe', 1); this.inv.add('scythe', 1); this.inv.add('sword', 1);
    this.inv.add('lettuce_seed', 12); this.inv.add('radish_seed', 8); this.inv.add('parsnip_seed', 8);

    for (const n of NPCS) this.relationships[n.id] = { points: 0, met: false, talkedToday: false, giftedToday: false, giftsThisWeek: 0 };
    // Activate quests with no prereqs
    for (const q of QUESTS) if (q.req.length === 0) this.quests.active.push(q.id);
    this.recipesKnown = ['salad', 'baked_potato', 'fence', 'gate', 'torch', 'stone_path', 'chest'];
    this.time.tomorrowWeather = 'sunny';
    return this;
  }

  area(id) { return this.areas[id]; }
  currentArea() { return this.areas[this.player.area] || this.mineLevels[this.player.area]; }

  rel(id) { return this.relationships[id]; }
  hearts(id) { return Math.floor((this.relationships[id]?.points || 0) / 250); }

  questDone(id) { return this.quests.done.includes(id); }
  questActive(id) { return this.quests.active.includes(id); }

  serialize() {
    return {
      seed: this.seed,
      player: this.player,
      time: this.time.serialize(),
      inv: this.inv.serialize(),
      skills: this.skills.serialize(),
      relationships: this.relationships,
      quests: this.quests,
      stats: this.stats,
      flags: this.flags,
      shippingBin: this.shippingBin,
      recipesKnown: this.recipesKnown,
      strains: this.strains,
      strainSeq: this.strainSeq,
      areas: Object.values(this.areas).map((a) => a.serialize()),
      meta: this.meta,
    };
  }

  static load(data) {
    const gs = new GameState();
    gs.seed = data.seed;
    gs.player = data.player;
    gs.time.load(data.time);
    gs.inv.load(data.inv);
    gs.skills.load(data.skills);
    gs.relationships = data.relationships;
    gs.quests = data.quests;
    gs.stats = { ...gs.stats, ...data.stats };
    gs.flags = data.flags || {};
    gs.shippingBin = data.shippingBin || [];
    gs.recipesKnown = data.recipesKnown || [];
    gs.strains = data.strains || {};
    gs.strainSeq = data.strainSeq || 1;
    gs.meta = data.meta;
    // Regenerate world then overlay saved dynamic state.
    gs.areas = generateWorld(gs.seed);
    for (const sa of data.areas || []) {
      const a = gs.areas[sa.id];
      if (!a) continue;
      a.ground = Int16Array.from(sa.ground);
      a.objects = sa.objects;
      a.farmland = new Map(sa.farmland);
      a.depth = sa.depth || 0;
    }
    return gs;
  }

  buildSaveData() {
    const d = this.serialize();
    d.meta = { ...this.meta, savedAt: Date.now(), playtime: this.meta.playtime };
    d.timeMeta = this.time.serialize();
    // surface a few fields for slot previews
    d.time = this.time.serialize();
    d.player = this.player;
    return d;
  }
}
