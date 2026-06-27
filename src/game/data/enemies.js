// Enemy definitions for the mine/caves. minLevel = mine depth they appear at.
// drops: array of {id, chance, min, max}. xp = combat xp on kill.

export const ENEMIES = {
  slime: { name: 'Green Slime', sprite: 'slime', hp: 16, dmg: 4, speed: 28, xp: 5, gold: [2, 6], minLevel: 1,
    drops: [{ id: 'sap', chance: 0.6, min: 1, max: 2 }, { id: 'fiber', chance: 0.3, min: 1, max: 1 }, { id: 'gem', chance: 0.02, min: 1, max: 1 }] },
  slime_blue: { name: 'Blue Slime', sprite: 'slime_blue', hp: 28, dmg: 7, speed: 32, xp: 9, gold: [4, 10], minLevel: 3,
    drops: [{ id: 'sap', chance: 0.6, min: 1, max: 3 }, { id: 'coal', chance: 0.2, min: 1, max: 1 }] },
  slime_red: { name: 'Red Slime', sprite: 'slime_red', hp: 42, dmg: 11, speed: 30, xp: 16, gold: [8, 16], minLevel: 6,
    drops: [{ id: 'sap', chance: 0.6, min: 1, max: 3 }, { id: 'gem', chance: 0.05, min: 1, max: 1 }] },
  bat: { name: 'Cave Bat', sprite: 'bat', hp: 12, dmg: 5, speed: 52, xp: 6, gold: [2, 7], minLevel: 2, flying: true, erratic: true,
    drops: [{ id: 'fiber', chance: 0.4, min: 1, max: 1 }] },
  bug: { name: 'Rock Crawler', sprite: 'bug', hp: 20, dmg: 6, speed: 24, xp: 8, gold: [3, 8], minLevel: 2,
    drops: [{ id: 'stone', chance: 0.5, min: 1, max: 2 }, { id: 'copper', chance: 0.15, min: 1, max: 1 }] },
  ghost: { name: 'Wisp', sprite: 'ghost', hp: 30, dmg: 9, speed: 40, xp: 14, gold: [6, 14], minLevel: 5, flying: true,
    drops: [{ id: 'crystal', chance: 0.06, min: 1, max: 1 }, { id: 'coal', chance: 0.3, min: 1, max: 2 }] },
  golem: { name: 'Stone Golem', sprite: 'golem', hp: 80, dmg: 16, speed: 16, xp: 35, gold: [16, 30], minLevel: 8,
    drops: [{ id: 'stone', chance: 1, min: 3, max: 6 }, { id: 'iron', chance: 0.4, min: 1, max: 2 }, { id: 'gem', chance: 0.1, min: 1, max: 1 }] },
};

// Which enemies can spawn at a given mine depth.
export function enemiesForDepth(depth) {
  return Object.entries(ENEMIES).filter(([, e]) => e.minLevel <= depth).map(([k]) => k);
}
