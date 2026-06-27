// Deterministic generation of every area from the world seed. Returns a map of
// areaId -> Area. Dynamic changes are saved separately; regen is only for new games.
import { RNG } from '../../engine/rng.js';
import { Area, nextObjId } from './world.js';
import { T } from './tiles.js';
import { TILE } from '../../engine/spritegen.js';

function fill(area, code) { area.ground.fill(code); }
function rect(area, x, y, w, h, code) {
  for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) area.setTile(tx, ty, code);
}
function obj(area, type, tx, ty, extra = {}) {
  area.objects.push({ id: nextObjId(), type, tx, ty, ...extra });
}

// ---- FARM ----
function genFarm(seed) {
  const w = 46, h = 40;
  const a = new Area({ id: 'farm', name: 'Your Farm', w, h, kind: 'farm', music: 'farm_spring' });
  fill(a, T.grass);
  const r = new RNG(seed + 1);

  // House (top-left)
  obj(a, 'building', 4, 3, { sprite: 'house', fw: 4, fh: 2, drawW: 64, drawH: 56, oy: 40, door: true,
    warp: { to: 'home', tx: 6, ty: 9 } });
  // a little dirt patch around the door
  rect(a, 5, 5, 2, 1, T.dirt);
  // Shipping bin beside the house — sells its contents overnight.
  obj(a, 'bin', 9, 5, { fw: 1, fh: 1, solid: true });
  obj(a, 'sign', 11, 5, { text: 'Shipping Bin: drop crops here to sell overnight.' });
  // Breeding bench — cross-breed seeds to engineer new crop strains.
  obj(a, 'bench', 12, 7, { fw: 1, fh: 1, solid: true });
  obj(a, 'sign', 14, 7, { text: 'Breeding Bench: cross two seeds to engineer a new strain!' });

  // Pond (bottom-right) for early fishing
  for (let ty = 30; ty < 37; ty++)
    for (let tx = 33; tx < 42; tx++) {
      const edge = tx === 33 || tx === 41 || ty === 30 || ty === 36;
      if ((tx - 37) ** 2 / 16 + (ty - 33) ** 2 / 9 <= 1) a.setTile(tx, ty, edge ? T.water : T.water_deep);
    }

  // Main path: from house down to south gate (warp to town)
  for (let ty = 7; ty < h; ty++) rect(a, 22, ty, 2, 1, T.path);
  rect(a, 21, h - 2, 4, 2, T.path);

  // South warp -> town
  a.warps.push({ x: 21, y: h - 1, w: 4, h: 1, to: 'town', tx: 22, ty: 2 });
  obj(a, 'sign', 20, h - 3, { text: 'Hollowbrook Town →' });

  // Scatter starter clutter (weeds, stones, branches) on the tillable field
  for (let i = 0; i < 60; i++) {
    const tx = r.int(2, w - 3), ty = r.int(8, h - 4);
    if (tx >= 20 && tx <= 25) continue; // keep path clear
    if (a.objectAt(tx, ty) || a.tileAt(tx, ty) !== T.grass) continue;
    const t = r.weighted([['weed', 6], ['forage', 2], ['log', 1], ['rock', 1]]);
    if (t === 'forage') obj(a, 'forage', tx, ty, { fk: r.pick(['branch', 'stone', 'flower', 'mushroom']), item: r.pick(['daffodil', 'dandelion', 'hazelnut']) });
    else if (t === 'log') obj(a, 'log', tx, ty, { hp: 3 });
    else if (t === 'rock') obj(a, 'rock', tx, ty, { hp: 2, size: 'med' });
    else obj(a, 'weed', tx, ty, { v: r.int(0, 2) });
  }
  // Border trees
  for (let i = 0; i < 26; i++) {
    let tx = r.int(0, w - 1), ty = r.int(2, h - 1);
    if (r.bool()) tx = r.bool() ? r.int(0, 2) : r.int(w - 3, w - 1);
    else ty = r.bool() ? r.int(2, 4) : r.int(h - 4, h - 2);
    if (a.objectAt(tx, ty) || a.tileAt(tx, ty) !== T.grass) continue;
    obj(a, r.bool() ? 'tree' : 'tree2', tx, ty, { hp: 4, kind: 'tree' });
  }
  return a;
}

// ---- HOME INTERIOR ----
function genHome(seed) {
  const w = 14, h = 12;
  const a = new Area({ id: 'home', name: 'Home', w, h, kind: 'indoor', music: null, lit: true });
  fill(a, T.wood_floor);
  // walls (planks border) - solid via objects? Use water_deep-like solid? Simpler: border collision objects.
  rect(a, 0, 0, w, 2, T.planks);
  // rug
  rect(a, 5, 5, 4, 3, T.rug);
  // Bed (top-right) - interact to sleep
  obj(a, 'bed', w - 4, 2, { fw: 3, fh: 2, solid: true });
  // Kitchen (top-left) - interact to cook
  obj(a, 'kitchen', 1, 2, { fw: 2, fh: 1, solid: true });
  // Storage chest
  obj(a, 'chest', 4, 2, { fw: 1, fh: 1, solid: true, home: true, items: [] });
  // Wall objects as collision around the border
  for (let tx = 0; tx < w; tx++) { obj(a, 'wall', tx, 0, { solid: true, hidden: true }); obj(a, 'wall', tx, 1, { solid: true, hidden: true }); }
  for (let ty = 2; ty < h; ty++) { obj(a, 'wall', 0, ty, { solid: true, hidden: true }); obj(a, 'wall', w - 1, ty, { solid: true, hidden: true }); }
  // Door at bottom -> farm
  a.setTile(6, h - 1, T.dirt); a.setTile(7, h - 1, T.dirt);
  a.warps.push({ x: 6, y: h - 1, w: 2, h: 1, to: 'farm', tx: 5, ty: 6 });
  // remove wall where door is
  a.objects = a.objects.filter((o) => !(o.type === 'wall' && o.ty === h - 1 && (o.tx === 6 || o.tx === 7)));
  return a;
}

// ---- TOWN ----
function genTown(seed) {
  const w = 48, h = 34;
  const a = new Area({ id: 'town', name: 'Hollowbrook', w, h, kind: 'town', music: 'town' });
  fill(a, T.grass);
  const r = new RNG(seed + 2);
  // central plaza of stone
  rect(a, 16, 12, 16, 10, T.stone_floor);
  // roads
  rect(a, 22, 0, 4, h, T.path);      // north-south (to farm at top)
  rect(a, 0, 15, w, 3, T.path);      // east-west
  // Shop (Mara) - north side of plaza
  obj(a, 'building', 17, 6, { sprite: 'shop', fw: 5, fh: 2, drawW: 72, drawH: 60, oy: 44, shop: 'general', door: true });
  obj(a, 'sign', 16, 9, { text: 'General Store — talk to enter' });
  // Houses for villagers
  obj(a, 'building', 4, 6, { sprite: 'house', fw: 4, fh: 2, drawW: 64, drawH: 56, oy: 40 });
  obj(a, 'building', 38, 6, { sprite: 'house', fw: 4, fh: 2, drawW: 64, drawH: 56, oy: 40 });
  obj(a, 'building', 4, 24, { sprite: 'house', fw: 4, fh: 2, drawW: 64, drawH: 56, oy: 40 });
  obj(a, 'building', 38, 24, { sprite: 'house', fw: 4, fh: 2, drawW: 64, drawH: 56, oy: 40 });

  // Decorative trees / bushes around edges
  for (let i = 0; i < 24; i++) {
    const tx = r.int(1, w - 2), ty = r.int(1, h - 2);
    if (a.objectAt(tx, ty) || a.tileAt(tx, ty) !== T.grass) continue;
    obj(a, r.bool(0.7) ? 'tree' : 'bush', tx, ty, { hp: 4, kind: 'tree', berry: r.bool(0.3) });
  }

  // Warps
  a.warps.push({ x: 22, y: 0, w: 4, h: 1, to: 'farm', tx: 22, ty: 38 });      // north -> farm
  a.warps.push({ x: 0, y: 15, w: 1, h: 3, to: 'forest', tx: 44, ty: 18 });    // west -> forest
  a.warps.push({ x: w - 1, y: 15, w: 1, h: 3, to: 'beach', tx: 2, ty: 14 });  // east -> beach
  a.warps.push({ x: 22, y: h - 1, w: 4, h: 1, to: 'mine_entrance', tx: 8, ty: 2 }); // south -> mine
  obj(a, 'sign', 1, 14, { text: '← Forest' });
  obj(a, 'sign', w - 2, 14, { text: 'Beach →' });
  obj(a, 'sign', 26, h - 3, { text: '↓ Mountain Mine' });
  obj(a, 'sign', 26, 1, { text: '↑ Your Farm' });
  return a;
}

// ---- FOREST ----
function genForest(seed) {
  const w = 46, h = 42;
  const a = new Area({ id: 'forest', name: 'Whispering Woods', w, h, kind: 'outdoor', music: 'farm_fall' });
  fill(a, T.grass_dark || T.grass);
  // base grass
  a.ground.fill(T.grass);
  const r = new RNG(seed + 3);
  // River down the middle-right
  for (let ty = 0; ty < h; ty++) {
    const cx = 30 + Math.round(Math.sin(ty * 0.3) * 3);
    for (let tx = cx; tx < cx + 3; tx++) a.setTile(tx, ty, tx === cx + 1 ? T.water_deep : T.water);
  }
  // dense trees
  for (let i = 0; i < 90; i++) {
    const tx = r.int(1, w - 2), ty = r.int(1, h - 2);
    if (a.tileAt(tx, ty) !== T.grass || a.objectAt(tx, ty)) continue;
    if (tx >= 28 && tx <= 34) continue; // keep river bank clear-ish
    obj(a, r.bool() ? 'tree' : 'tree2', tx, ty, { hp: 4, kind: 'tree' });
  }
  // forage + bushes
  for (let i = 0; i < 40; i++) {
    const tx = r.int(1, w - 2), ty = r.int(1, h - 2);
    if (a.tileAt(tx, ty) !== T.grass || a.objectAt(tx, ty)) continue;
    if (r.bool(0.4)) obj(a, 'bush', tx, ty, { hp: 2, berry: r.bool(0.5) });
    else obj(a, 'forage', tx, ty, { fk: r.pick(['mushroom', 'berry', 'flower', 'leek']), item: r.pick(['wild_mushroom', 'wild_berry', 'blackberry', 'wild_leek', 'hazelnut', 'daffodil']) });
  }
  // Warp back to town (east edge)
  a.warps.push({ x: w - 1, y: 17, w: 1, h: 4, to: 'town', tx: 2, ty: 16 });
  obj(a, 'sign', w - 2, 16, { text: 'Town →' });
  return a;
}

// ---- BEACH ----
function genBeach(seed) {
  const w = 44, h = 30;
  const a = new Area({ id: 'beach', name: 'Hollow Cove', w, h, kind: 'outdoor', music: 'farm_summer' });
  fill(a, T.sand);
  const r = new RNG(seed + 4);
  // grass strip near town entrance (west)
  rect(a, 0, 0, 8, h, T.grass);
  // ocean (south half)
  for (let ty = 18; ty < h; ty++) for (let tx = 0; tx < w; tx++) a.setTile(tx, ty, ty > 21 ? T.water_deep : T.water);
  // pier (wood planks into the water)
  rect(a, 20, 16, 3, 10, T.planks);
  obj(a, 'sign', 19, 15, { text: 'Fishing Pier' });
  // palms / driftwood / forage shells
  for (let i = 0; i < 14; i++) {
    const tx = r.int(2, w - 3), ty = r.int(2, 16);
    if (a.tileAt(tx, ty) !== T.sand || a.objectAt(tx, ty)) continue;
    if (r.bool(0.5)) obj(a, 'forage', tx, ty, { fk: 'flower', item: r.pick(['daffodil', 'dandelion']) });
    else obj(a, 'tree', tx, ty, { hp: 4, kind: 'tree' });
  }
  // Warp to town (west grass edge)
  a.warps.push({ x: 0, y: 13, w: 1, h: 4, to: 'town', tx: 46, ty: 16 });
  obj(a, 'sign', 1, 12, { text: '← Town' });
  return a;
}

// ---- MINE ENTRANCE ----
function genMineEntrance(seed) {
  const w = 18, h = 14;
  const a = new Area({ id: 'mine_entrance', name: 'Mine Entrance', w, h, kind: 'cave', music: 'mine', lit: false });
  fill(a, T.rock_floor);
  const r = new RNG(seed + 5);
  rect(a, 0, 0, w, 1, T.cave_floor);
  // ladder down into the mine (procedural levels)
  obj(a, 'ladder', 9, 6, { fw: 1, fh: 1, mineDown: 1 });
  obj(a, 'sign', 8, 4, { text: 'The mine descends here. Beware.' });
  // some starter rocks
  for (let i = 0; i < 8; i++) {
    const tx = r.int(2, w - 3), ty = r.int(3, h - 3);
    if (a.objectAt(tx, ty)) continue;
    obj(a, 'rock', tx, ty, { hp: 2, size: 'med' });
  }
  // exit up to town
  a.warps.push({ x: 8, y: 0, w: 2, h: 1, to: 'town', tx: 23, ty: 32 });
  obj(a, 'sign', 7, 1, { text: '↑ Town' });
  return a;
}

export function generateWorld(seed) {
  const areas = {};
  areas.farm = genFarm(seed);
  areas.home = genHome(seed);
  areas.town = genTown(seed);
  areas.forest = genForest(seed);
  areas.beach = genBeach(seed);
  areas.mine_entrance = genMineEntrance(seed);
  return areas;
}

// ---- Procedural mine level (generated on the fly, not saved long-term) ----
export function generateMineLevel(seed, depth) {
  const w = 30, h = 26;
  const a = new Area({ id: 'mine_' + depth, name: `Mine — Level ${depth}`, w, h, kind: 'cave',
    music: 'mine', lit: false, spawnsEnemies: true, depth });
  fill(a, T.cave_floor);
  const r = new RNG(seed * 131 + depth * 977);
  // ring of walls (rock) around the border
  for (let tx = 0; tx < w; tx++) { obj(a, 'rock', tx, 0, { hp: 99, size: 'big', wall: true }); obj(a, 'rock', tx, h - 1, { hp: 99, size: 'big', wall: true }); }
  for (let ty = 1; ty < h - 1; ty++) { obj(a, 'rock', 0, ty, { hp: 99, size: 'big', wall: true }); obj(a, 'rock', w - 1, ty, { hp: 99, size: 'big', wall: true }); }
  // scatter ore/rocks
  const oreTable = [['rock', 8], ['ore_coal', 4], ['ore_copper', 4]];
  if (depth >= 3) oreTable.push(['ore_iron', 3]);
  if (depth >= 5) oreTable.push(['ore_gold', 2]);
  if (depth >= 4) oreTable.push(['ore_gem', 1]);
  if (depth >= 7) oreTable.push(['ore_crystal', 1]);
  const count = 26 + depth;
  for (let i = 0; i < count; i++) {
    const tx = r.int(2, w - 3), ty = r.int(2, h - 3);
    if (a.objectAt(tx, ty)) continue;
    const type = r.weighted(oreTable);
    if (type === 'rock') obj(a, 'rock', tx, ty, { hp: 2, size: r.pick(['med', 'small']) });
    else obj(a, type, tx, ty, { hp: 3, ore: type.replace('ore_', '') });
  }
  // a few cave forage
  for (let i = 0; i < 3; i++) {
    const tx = r.int(2, w - 3), ty = r.int(2, h - 3);
    if (!a.objectAt(tx, ty)) obj(a, 'forage', tx, ty, { fk: 'mushroom', item: 'wild_mushroom' });
  }
  // ladder down (find empty tile) and ladder up
  const placeLadder = (kind) => {
    for (let tries = 0; tries < 200; tries++) {
      const tx = r.int(3, w - 4), ty = r.int(3, h - 4);
      if (!a.objectAt(tx, ty)) { obj(a, kind, tx, ty, { fw: 1, fh: 1, mineDown: kind === 'ladder' ? depth + 1 : undefined, mineUp: kind === 'ladder_up' ? depth : undefined }); return { tx, ty }; }
    }
    return { tx: 5, ty: 5 };
  };
  const up = placeLadder('ladder_up');
  placeLadder('ladder');
  a.entryTx = up.tx; a.entryTy = up.ty + 1;
  // every 5 levels, a treasure chest
  if (depth % 5 === 0) {
    for (let tries = 0; tries < 50; tries++) {
      const tx = r.int(3, w - 4), ty = r.int(3, h - 4);
      if (!a.objectAt(tx, ty)) { obj(a, 'chest', tx, ty, { treasure: true, depth }); break; }
    }
  }
  return a;
}
