// Player skills & leveling. Five skills + cooking. Levels 0..10.
export const SKILL_IDS = ['farming', 'foraging', 'mining', 'combat', 'fishing', 'cooking'];
export const SKILL_NAMES = {
  farming: 'Farming', foraging: 'Foraging', mining: 'Mining',
  combat: 'Combat', fishing: 'Fishing', cooking: 'Cooking',
};
export const MAX_LEVEL = 10;

// XP needed to *reach* a given level (cumulative).
export function xpForLevel(lvl) { return Math.round(50 * lvl * lvl + 50 * lvl); }

export class Skills {
  constructor() {
    this.xp = {};
    for (const s of SKILL_IDS) this.xp[s] = 0;
  }
  level(skill) {
    const xp = this.xp[skill] || 0;
    let lvl = 0;
    while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
    return lvl;
  }
  // Returns new level if a level-up occurred, else null.
  addXp(skill, amt) {
    if (!(skill in this.xp)) return null;
    const before = this.level(skill);
    this.xp[skill] += amt;
    const after = this.level(skill);
    return after > before ? after : null;
  }
  progress(skill) {
    const lvl = this.level(skill);
    if (lvl >= MAX_LEVEL) return 1;
    const cur = xpForLevel(lvl), next = xpForLevel(lvl + 1);
    return (this.xp[skill] - cur) / (next - cur);
  }
  total() { return SKILL_IDS.reduce((a, s) => a + this.level(s), 0); }
  serialize() { return { ...this.xp }; }
  load(d) { for (const s of SKILL_IDS) this.xp[s] = d[s] || 0; }
}
