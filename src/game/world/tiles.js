// Ground tile type registry. Ground is stored as integer codes for compact
// saves; this maps codes <-> names and defines per-tile properties.

export const TILE_NAMES = [
  'grass', 'grass_dark', 'grass_spring', 'grass_summer', 'grass_fall', 'grass_winter',
  'dirt', 'soil', 'soil_wet', 'path', 'stone_floor', 'wood_floor', 'sand', 'water',
  'water_deep', 'rock_floor', 'cave_floor', 'planks', 'rug',
];
export const T = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));

// Tiles that block movement on their own (water, etc.). Soil/grass are walkable.
export const SOLID_TILES = new Set([T.water, T.water_deep]);
// Tiles you can till into soil (farmland).
export const TILLABLE = new Set([T.grass, T.grass_dark, T.grass_spring, T.grass_summer, T.grass_fall, T.dirt]);
// Tiles considered "water" for fishing.
export const WATER_TILES = new Set([T.water, T.water_deep]);

// Pick the seasonal grass code for a base grass tile.
export function seasonalGrass(season) {
  return [T.grass_spring, T.grass_summer, T.grass_fall, T.grass_winter][season] ?? T.grass;
}
