// Quests & story. type drives completion checking in the quest system.
//  gather: deliver items from inventory (consumed)
//  ship:   cumulatively ship items (any of list)
//  gold:   reach a gold total
//  skill:  reach a skill level
//  catch:  catch N distinct fish
//  kill:   defeat N enemies
//  mine:   reach mine depth
//  forage: collect N distinct forageables
// req: array of quest ids that must be done first. story: part of main arc.

export const QUESTS = [
  // ---- Onboarding ----
  { id: 'first_harvest', title: 'First Harvest', story: true,
    desc: 'Plant some seeds and harvest your first crop. Mara left starter seeds in your inventory.',
    type: 'ship', items: null, goal: 1, anyCrop: true,
    reward: { gold: 100, items: { lettuce_seed: 5 } }, giver: 'mara', req: [] },
  { id: 'clear_land', title: 'Clearing the Land', story: true,
    desc: 'Your farm is overgrown. Clear 8 weeds, rocks, or branches.',
    type: 'clear', goal: 8, reward: { gold: 80, items: { wood: 10 } }, giver: 'gus', req: [] },
  { id: 'meet_town', title: 'A Warm Welcome', story: true,
    desc: 'Introduce yourself to 4 villagers in Hollowbrook.',
    type: 'meet', goal: 4, reward: { gold: 120 }, giver: 'mara', req: ['first_harvest'] },

  // ---- Skill quests ----
  { id: 'green_thumb', title: 'Green Thumb',
    desc: 'Reach Farming level 3.', type: 'skill', skill: 'farming', goal: 3,
    reward: { gold: 250, items: { sprinkler: 1 } }, giver: 'nina', req: ['first_harvest'] },
  { id: 'lumberjack', title: 'Timber!',
    desc: 'Chop wood until you have 50 in your pack.', type: 'gather', items: { wood: 50 },
    reward: { gold: 200, items: { axe: 1 } }, giver: 'gus', req: [] },
  { id: 'spelunker', title: 'Into the Deep',
    desc: 'Reach mine depth 5.', type: 'mine', goal: 5,
    reward: { gold: 400, items: { iron_bar: 2 } }, giver: 'bram', req: [] },
  { id: 'angler', title: 'The Angler',
    desc: 'Catch 6 different kinds of fish.', type: 'catch', goal: 6,
    reward: { gold: 500, items: { fishingrod: 1 } }, giver: 'theo', req: [] },
  { id: 'forager', title: 'Fruits of the Forest',
    desc: 'Forage 5 different wild items.', type: 'forage', goal: 5,
    reward: { gold: 300, items: { greens_smoothie: 2 } }, giver: 'pip', req: [] },
  { id: 'monster_hunter', title: 'Pest Control',
    desc: 'Defeat 20 cave monsters.', type: 'kill', goal: 20,
    reward: { gold: 450, items: { sword: 1 } }, giver: 'bram', req: ['spelunker'] },

  // ---- Delivery quests ----
  { id: 'soup_kitchen', title: "Rosa's Soup", desc: 'Bring Rosa 3 Kale and 2 Potato for the autumn soup.',
    type: 'gather', items: { kale: 3, potato: 2 }, reward: { gold: 280, items: { veggie_stew: 2 }, hearts: { rosa: 1 } }, giver: 'rosa', req: [] },
  { id: 'market_day', title: 'Market Day', desc: 'Ship 2,500g worth of goods.',
    type: 'gold', field: 'shipTotal', goal: 2500, reward: { gold: 600 }, giver: 'mara', req: ['first_harvest'] },
  { id: 'edith_feed', title: 'Winter Feed', desc: 'Bring Edith 10 Corn to feed the animals through winter.',
    type: 'gather', items: { corn: 10 }, reward: { gold: 400, items: { milk: 3 }, hearts: { edith: 1 } }, giver: 'edith', req: [] },

  // ---- Main story arc: the Ancient Green ----
  { id: 'ancient_clue', title: 'A Whisper in the Leaves', story: true,
    desc: 'Nina found an old seed pouch. Reach Farming level 5 to prove you can grow the rare strain.',
    type: 'skill', skill: 'farming', goal: 5,
    reward: { gold: 500 }, giver: 'nina', req: ['green_thumb'] },
  { id: 'ancient_soil', title: 'Restoring the Soil', story: true,
    desc: 'The lost strain needs rich earth. Deliver 5 Fertilizer, 20 Sap, and 1 Gold Bar to Nina.',
    type: 'gather', items: { fertilizer: 5, sap: 20, gold_bar: 1 },
    reward: { gold: 800, items: { ancientgreen_seed: 1 } }, giver: 'nina', req: ['ancient_clue'] },
  { id: 'ancient_green', title: 'The Ancient Green', story: true,
    desc: 'Grow and harvest the legendary Ancient Green. The valley has waited centuries.',
    type: 'ship', items: ['ancientgreen'], goal: 1,
    reward: { gold: 5000, items: { recall_charm: 1 } }, giver: 'nina', req: ['ancient_soil'] },

  // ---- Wealth milestone ----
  { id: 'tycoon', title: 'Valley Tycoon', desc: 'Amass 25,000g.',
    type: 'gold', field: 'gold', goal: 25000, reward: { gold: 2000 }, giver: 'mara', req: ['market_day'] },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
