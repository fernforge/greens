// Cooking & crafting recipes. ingredients: {itemId: count}. unlock: skill+level or null.
// type: 'cook' (kitchen) | 'craft' (anywhere/workbench).

export const RECIPES = [
  // --- Cooking ---
  { id: 'salad', type: 'cook', out: 'salad', n: 1, ingredients: { lettuce: 1, spinach: 1 }, unlock: null },
  { id: 'coleslaw', type: 'cook', out: 'coleslaw', n: 1, ingredients: { cabbage: 1, radish: 1 }, unlock: { skill: 'cooking', lvl: 1 } },
  { id: 'veggie_soup', type: 'cook', out: 'veggie_soup', n: 1, ingredients: { potato: 1, leek: 1, kale: 1 }, unlock: { skill: 'cooking', lvl: 1 } },
  { id: 'greens_smoothie', type: 'cook', out: 'greens_smoothie', n: 1, ingredients: { kale: 1, spinach: 1, basil: 1 }, unlock: { skill: 'foraging', lvl: 2 } },
  { id: 'stir_fry', type: 'cook', out: 'stir_fry', n: 1, ingredients: { broccoli: 1, bellpepper: 1, scallion: 1 }, unlock: { skill: 'cooking', lvl: 2 } },
  { id: 'veggie_stew', type: 'cook', out: 'veggie_stew', n: 1, ingredients: { potato: 1, turnip: 1, leek: 1, kale: 1 }, unlock: { skill: 'cooking', lvl: 3 } },
  { id: 'pickles', type: 'cook', out: 'pickles', n: 1, ingredients: { cucumber: 2 }, unlock: { skill: 'cooking', lvl: 1 } },
  { id: 'baked_potato', type: 'cook', out: 'baked_potato', n: 1, ingredients: { potato: 1 }, unlock: null },
  { id: 'fish_dinner', type: 'cook', out: 'fish_dinner', n: 1, ingredients: { bass: 1, parsnip: 1 }, unlock: { skill: 'fishing', lvl: 2 } },
  { id: 'pumpkin_pie', type: 'cook', out: 'pumpkin_pie', n: 1, ingredients: { pumpkin: 1, milk: 1, egg: 1 }, unlock: { skill: 'cooking', lvl: 4 } },
  { id: 'berry_jam', type: 'cook', out: 'berry_jam', n: 1, ingredients: { wild_berry: 2, strawberry: 1 }, unlock: { skill: 'foraging', lvl: 1 } },
  { id: 'herb_tea', type: 'cook', out: 'herb_tea', n: 1, ingredients: { basil: 1, dandelion: 1 }, unlock: { skill: 'foraging', lvl: 1 } },
  { id: 'corn_bread', type: 'cook', out: 'corn_bread', n: 1, ingredients: { corn: 2, egg: 1 }, unlock: { skill: 'cooking', lvl: 2 } },
  { id: 'energy_tonic', type: 'cook', out: 'energy_tonic', n: 1, ingredients: { starfruit: 1, honey: 1, wild_mushroom: 1 }, unlock: { skill: 'cooking', lvl: 6 } },

  // --- Crafting ---
  { id: 'copper_bar', type: 'craft', out: 'copper_bar', n: 1, ingredients: { copper: 4, coal: 1 }, unlock: { skill: 'mining', lvl: 1 } },
  { id: 'iron_bar', type: 'craft', out: 'iron_bar', n: 1, ingredients: { iron: 4, coal: 2 }, unlock: { skill: 'mining', lvl: 3 } },
  { id: 'gold_bar', type: 'craft', out: 'gold_bar', n: 1, ingredients: { gold: 4, coal: 3 }, unlock: { skill: 'mining', lvl: 5 } },
  { id: 'chest', type: 'craft', out: 'chest', n: 1, ingredients: { wood: 30 }, unlock: null },
  { id: 'scarecrow', type: 'craft', out: 'scarecrow', n: 1, ingredients: { wood: 20, fiber: 10, coal: 1 }, unlock: { skill: 'farming', lvl: 1 } },
  { id: 'sprinkler', type: 'craft', out: 'sprinkler', n: 1, ingredients: { copper_bar: 1, iron_bar: 1 }, unlock: { skill: 'farming', lvl: 3 } },
  { id: 'fence', type: 'craft', out: 'fence', n: 5, ingredients: { wood: 4 }, unlock: null },
  { id: 'gate', type: 'craft', out: 'gate', n: 1, ingredients: { wood: 6 }, unlock: null },
  { id: 'torch', type: 'craft', out: 'torch', n: 2, ingredients: { wood: 1, sap: 2 }, unlock: null },
  { id: 'stone_path', type: 'craft', out: 'stone_path', n: 5, ingredients: { stone: 2 }, unlock: null },
  { id: 'fertilizer', type: 'craft', out: 'fertilizer', n: 2, ingredients: { sap: 2, fiber: 4 }, unlock: { skill: 'farming', lvl: 2 } },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
