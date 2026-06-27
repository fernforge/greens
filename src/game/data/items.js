// Master item registry. Crop seeds & produce are derived from CROPS; everything
// else (tools, materials, forage, fish, food, misc) is declared here.
import { CROPS } from './crops.js';
import { FISH } from './fish.js';

// type: 'seed'|'crop'|'tool'|'material'|'forage'|'fish'|'food'|'misc'
export const ITEMS = {};

function add(item) {
  if (ITEMS[item.id]) console.warn('dup item', item.id);
  ITEMS[item.id] = { stack: 999, ...item };
  return item;
}

// --- Tools (non-stacking, leveled) ---
const TOOLS = [
  { id: 'hoe', name: 'Hoe', tool: 'hoe', desc: 'Till soil into plantable rows.' },
  { id: 'wateringcan', name: 'Watering Can', tool: 'wateringcan', desc: 'Water crops so they grow.' },
  { id: 'axe', name: 'Axe', tool: 'axe', desc: 'Chop trees for wood.' },
  { id: 'pickaxe', name: 'Pickaxe', tool: 'pickaxe', desc: 'Break rocks for stone & ore.' },
  { id: 'scythe', name: 'Scythe', tool: 'scythe', desc: 'Clear weeds & grass quickly.' },
  { id: 'sword', name: 'Old Sword', tool: 'sword', desc: 'A rusty blade. Fends off cave critters.' },
  { id: 'fishingrod', name: 'Fishing Rod', tool: 'fishingrod', desc: 'Cast into water to catch fish.' },
];
for (const t of TOOLS) add({ ...t, type: 'tool', stack: 1, price: 0, sellPrice: 0, iconKind: 'tool' });

// --- Crop-derived seeds & produce ---
for (const c of CROPS) {
  add({
    id: c.id + '_seed', name: c.name + ' Seeds', type: 'seed', cropId: c.id,
    price: c.seedPrice, sellPrice: Math.max(1, Math.floor(c.seedPrice * 0.4)),
    season: c.season, desc: `Plant in ${seasonList(c.season)}. ~${c.growDays} days.`,
    iconKind: 'seed', seedColor: c.produce.c,
  });
  add({
    id: c.id, name: c.name, type: 'crop', cropId: c.id,
    price: c.sellPrice, sellPrice: c.sellPrice,
    edible: { energy: Math.round(c.sellPrice * 0.5), health: Math.round(c.sellPrice * 0.2) },
    desc: 'A fresh harvest.', iconKind: 'produce', produce: c.produce,
  });
}

// --- Materials ---
const MATS = [
  ['wood', 'Wood', 4], ['stone', 'Stone', 4], ['fiber', 'Fiber', 2], ['clay', 'Clay', 12],
  ['copper', 'Copper Ore', 18], ['iron', 'Iron Ore', 40], ['gold', 'Gold Ore', 90], ['coal', 'Coal', 25],
  ['copper_bar', 'Copper Bar', 60], ['iron_bar', 'Iron Bar', 120], ['gold_bar', 'Gold Bar', 250],
  ['gem', 'Gem', 180], ['crystal', 'Crystal', 300], ['sap', 'Sap', 3], ['hardwood', 'Hardwood', 15],
  ['egg', 'Egg', 30], ['milk', 'Milk', 50], ['wool', 'Wool', 120], ['honey', 'Honey', 80],
];
for (const [id, name, price] of MATS) add({ id, name, type: 'material', price, sellPrice: price, iconKind: 'material', desc: 'A useful resource.' });

// --- Forageables ---
const FORAGE = [
  ['wild_mushroom', 'Wild Mushroom', 30, 'mushroom', { energy: 20, health: 8 }],
  ['wild_berry', 'Wild Berry', 18, 'berry', { energy: 14, health: 6 }],
  ['daffodil', 'Daffodil', 24, 'flower', null],
  ['wild_leek', 'Wild Leek', 22, 'leek', { energy: 16, health: 6 }],
  ['dandelion', 'Dandelion', 20, 'flower', { energy: 10 }],
  ['hazelnut', 'Hazelnut', 28, 'berry', { energy: 18 }],
  ['blackberry', 'Blackberry', 16, 'berry', { energy: 12, health: 4 }],
  ['snowdrop', 'Snowdrop', 35, 'flower', null],
];
for (const [id, name, price, fk, ed] of FORAGE)
  add({ id, name, type: 'forage', price, sellPrice: price, iconKind: 'forage', forageKind: fk, edible: ed, desc: 'Foraged from the wild.' });

// --- Fish (from FISH data) ---
for (const f of FISH) {
  add({ id: f.id, name: f.name, type: 'fish', price: f.price, sellPrice: f.price,
    edible: { energy: Math.round(f.price * 0.4), health: Math.round(f.price * 0.15) },
    iconKind: 'fish', fishSpec: f.spec, desc: f.desc || 'A fish.' });
}

// --- Cooked food (referenced by recipes) ---
const FOODS = [
  ['salad', 'Garden Salad', 110, { energy: 60, health: 25 }, 'plate', '#7cc04f'],
  ['veggie_soup', 'Veggie Soup', 140, { energy: 80, health: 40 }, 'bowl', '#e08a2e'],
  ['greens_smoothie', 'Greens Smoothie', 160, { energy: 90, health: 30 }, 'drink', '#7cc04f'],
  ['stir_fry', 'Garden Stir-Fry', 200, { energy: 110, health: 45 }, 'plate', '#3f8a36'],
  ['coleslaw', 'Coleslaw', 130, { energy: 70, health: 20 }, 'bowl', '#9ad96a'],
  ['veggie_stew', 'Hearty Stew', 260, { energy: 140, health: 70 }, 'bowl', '#c8772e'],
  ['pickles', 'Pickles', 90, { energy: 40, health: 15 }, 'plate', '#4f8c36'],
  ['baked_potato', 'Baked Potato', 100, { energy: 70, health: 25 }, 'baked', '#c79a5e'],
  ['fish_dinner', 'Fish Dinner', 240, { energy: 120, health: 55 }, 'plate', '#6aa0d0'],
  ['pumpkin_pie', 'Pumpkin Pie', 320, { energy: 130, health: 50 }, 'baked', '#e08a2e'],
  ['berry_jam', 'Berry Jam', 150, { energy: 60, health: 30 }, 'drink', '#7a3bd2'],
  ['herb_tea', 'Herb Tea', 80, { energy: 40, health: 50 }, 'drink', '#9ad96a'],
  ['corn_bread', 'Corn Bread', 120, { energy: 75, health: 20 }, 'baked', '#ffd84e'],
  ['energy_tonic', 'Energy Tonic', 400, { energy: 200, health: 60 }, 'drink', '#ffe046'],
];
for (const [id, name, price, ed, shape, c] of FOODS)
  add({ id, name, type: 'food', price, sellPrice: price, iconKind: 'food', edible: ed, foodSpec: { shape, c }, desc: 'Home cooking restores energy.' });

// --- Misc / crafted ---
const MISC = [
  ['chest', 'Chest', 0, 'A box for storing items.'],
  ['scarecrow', 'Scarecrow', 0, 'Keeps crows off nearby crops.'],
  ['sprinkler', 'Sprinkler', 0, 'Auto-waters adjacent tiles each morning.'],
  ['fence', 'Fence', 0, 'A wooden fence segment.'],
  ['gate', 'Gate', 0, 'A fence gate.'],
  ['torch', 'Torch', 0, 'Lights the area at night.'],
  ['fertilizer', 'Fertilizer', 0, 'Improves crop quality. Apply to tilled soil.'],
  ['stone_path', 'Stone Path', 0, 'A decorative stone walkway.'],
  ['recall_charm', 'Recall Charm', 600, 'Warps you home instantly. One use per day.'],
];
for (const [id, name, price, desc] of MISC)
  add({ id, name, type: 'misc', price, sellPrice: Math.floor(price * 0.5), iconKind: 'material', desc, placeable: ['chest', 'scarecrow', 'sprinkler', 'fence', 'gate', 'torch', 'stone_path'].includes(id) });

export function seasonList(arr) {
  const names = ['Spring', 'Summer', 'Fall', 'Winter'];
  return arr.map((s) => names[s]).join('/');
}

export function getItem(id) { return ITEMS[id]; }
export function itemName(id) { return ITEMS[id]?.name || id; }
export function itemPrice(id) { return ITEMS[id]?.sellPrice ?? ITEMS[id]?.price ?? 0; }
