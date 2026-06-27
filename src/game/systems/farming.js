// Farming logic: tilling, planting, watering, growth, and harvesting.
import { CROP_BY_ID } from '../data/crops.js';
import { T } from '../world/tiles.js';

export function canTill(area, tx, ty) {
  return area.kind === 'farm' && area.tillable(tx, ty) && !area.plotAt(tx, ty);
}

export function tillTile(area, tx, ty) {
  if (!canTill(area, tx, ty)) return false;
  area.till(tx, ty);
  area.setTile(tx, ty, T.soil);
  return true;
}

export function waterTile(area, tx, ty) {
  const plot = area.plotAt(tx, ty);
  if (!plot || plot.watered) return false;
  plot.watered = true;
  area.setTile(tx, ty, T.soil_wet);
  return true;
}

export function plantSeed(area, tx, ty, cropId, strainId = null, growDays = null) {
  const plot = area.plotAt(tx, ty);
  if (!plot || plot.cropId) return false;
  const crop = CROP_BY_ID[cropId];
  if (!crop) return false;
  plot.cropId = cropId;
  plot.strainId = strainId || null;
  plot.growDays = growDays || null;   // strain growth-speed override
  plot.age = 0;
  plot.stage = 0;
  plot.fullyGrown = false;
  plot.dead = false;
  plot.regrowReady = false;
  return true;
}

export function fertilizePlot(area, tx, ty) {
  const plot = area.plotAt(tx, ty);
  if (!plot || plot.fertilized || plot.cropId) return false;
  plot.fertilized = true;
  return true;
}

// Visual growth stage index for a plot's crop sprite array.
export function cropStageIndex(plot, crop) {
  const stages = crop.stages || 5;
  if (plot.fullyGrown) return stages - 1;
  const gd = plot.growDays || crop.growDays;
  const ratio = gd > 0 ? plot.age / gd : 1;
  return Math.max(0, Math.min(stages - 2, Math.floor(ratio * (stages - 1))));
}

export function isHarvestable(plot) {
  return plot && plot.cropId && plot.fullyGrown && !plot.dead;
}

// Harvest a plot. Returns { cropId, qty, quality, xp } or null.
export function harvestPlot(area, tx, ty, rng, luck = 0) {
  const plot = area.plotAt(tx, ty);
  if (!isHarvestable(plot)) return null;
  const crop = CROP_BY_ID[plot.cropId];
  let qty = rng.int(crop.yieldMin, crop.yieldMax);
  // quality: 0 normal,1 silver,2 gold — boosted by fertilizer & farming luck
  let q = 0;
  const roll = rng.next() + luck * 0.08 + (plot.fertilized ? 0.2 : 0);
  if (roll > 1.05) q = 2; else if (roll > 0.8) q = 1;
  if (q === 2) qty += 1;
  const strainId = plot.strainId || null;

  if (crop.regrow && crop.regrow > 0) {
    // regrowing crop: reset to regrow countdown (keeps its strain)
    plot.fullyGrown = false;
    plot.age = Math.max(0, (plot.growDays || crop.growDays) - crop.regrow);
    plot.regrowReady = false;
  } else {
    // single harvest: plot returns to tilled empty soil
    plot.cropId = null;
    plot.strainId = null;
    plot.growDays = null;
    plot.age = 0;
    plot.stage = 0;
    plot.fullyGrown = false;
  }
  return { cropId: crop.id, qty, quality: q, xp: crop.xp, strainId };
}

export function clearPlot(area, tx, ty) {
  const plot = area.plotAt(tx, ty);
  if (!plot) return;
  if (plot.cropId) { plot.cropId = null; plot.fullyGrown = false; plot.age = 0; }
  else {
    area.farmland.delete(area.plotKey(tx, ty));
    if (area.tileAt(tx, ty) === T.soil || area.tileAt(tx, ty) === T.soil_wet) area.setTile(tx, ty, T.dirt);
  }
}

// --- Day rollover for ALL farmland in an area ---
export function advanceFarm(area, time, rng) {
  const raining = time.isRaining();
  // 1) grow crops that were watered (or rained on yesterday)
  for (const plot of area.farmland.values()) {
    if (!plot.cropId) {
      // dry out the soil tile
      if (area.tileAt(plot.tx, plot.ty) === T.soil_wet) { plot.watered = false; area.setTile(plot.tx, plot.ty, T.soil); }
      continue;
    }
    const crop = CROP_BY_ID[plot.cropId];
    // season check (greenhouse not implemented => out-of-season dies, except all-season)
    const allSeason = crop.season.length === 4;
    if (!allSeason && !crop.season.includes(time.season)) { plot.dead = true; }
    if (plot.dead) continue;
    const watered = plot.watered || raining;
    if (watered && !plot.fullyGrown) {
      plot.age += 1;
      if (plot.age >= (plot.growDays || crop.growDays)) plot.fullyGrown = true;
    }
    // reset watering for the new day
    plot.watered = false;
    if (area.tileAt(plot.tx, plot.ty) === T.soil_wet && !raining) area.setTile(plot.tx, plot.ty, T.soil);
  }
  // 2) rain waters everything in the morning
  if (raining) {
    for (const plot of area.farmland.values()) {
      plot.watered = true;
      if (area.tileAt(plot.tx, plot.ty) === T.soil) area.setTile(plot.tx, plot.ty, T.soil_wet);
    }
  }
  // 3) sprinklers water orthogonally adjacent plots
  for (const o of area.objects) {
    if (o.type !== 'sprinkler') continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const p = area.plotAt(o.tx + dx, o.ty + dy);
      if (p) { p.watered = true; if (area.tileAt(p.tx, p.ty) === T.soil) area.setTile(p.tx, p.ty, T.soil_wet); }
    }
  }
}
