// Achievements — milestone rewards with unlock toasts. Tracked in gs.flags.achievements.
// Each check reads existing stats so nothing extra needs persisting.

export const ACHIEVEMENTS = [
  { id: 'first_sprout', name: 'First Sprout', desc: 'Harvest your first crop.', color: '#9ad96a', check: (gs) => gs.stats.cropsHarvested >= 1 },
  { id: 'green_thumb', name: 'Green Thumb', desc: 'Harvest 50 crops.', color: '#7cc04f', check: (gs) => gs.stats.cropsHarvested >= 50 },
  { id: 'bumper_crop', name: 'Bumper Crop', desc: 'Harvest 250 crops.', color: '#5b9d3e', check: (gs) => gs.stats.cropsHarvested >= 250 },
  { id: 'hooked', name: 'Hooked', desc: 'Catch 5 kinds of fish.', color: '#6aa0d0', check: (gs) => gs.stats.fishCaught.length >= 5 },
  { id: 'master_angler', name: 'Master Angler', desc: 'Catch all 16 kinds of fish.', color: '#4a8fd0', check: (gs) => gs.stats.fishCaught.length >= 16 },
  { id: 'forager', name: 'Forager', desc: 'Find 8 kinds of forage.', color: '#c8a85a', check: (gs) => gs.stats.foraged.length >= 8 },
  { id: 'spelunker', name: 'Spelunker', desc: 'Reach mine depth 10.', color: '#8b8790', check: (gs) => gs.stats.deepestMine >= 10 },
  { id: 'deep_delver', name: 'Deep Delver', desc: 'Reach mine depth 25.', color: '#d89cff', check: (gs) => gs.stats.deepestMine >= 25 },
  { id: 'monster_hunter', name: 'Monster Hunter', desc: 'Defeat 50 monsters.', color: '#e85f5f', check: (gs) => gs.stats.kills >= 50 },
  { id: 'home_cook', name: 'Home Cook', desc: 'Cook 10 dishes.', color: '#e08a2e', check: (gs) => gs.stats.itemsCooked >= 10 },
  { id: 'coin_collector', name: 'Coin Collector', desc: 'Earn 10,000g total.', color: '#ffe46b', check: (gs) => gs.stats.goldEarned >= 10000 },
  { id: 'valley_tycoon', name: 'Valley Tycoon', desc: 'Earn 100,000g total.', color: '#ffd24e', check: (gs) => gs.stats.goldEarned >= 100000 },
  { id: 'jack_of_trades', name: 'Jack of All Trades', desc: 'Reach 20 total skill levels.', color: '#aede6a', check: (gs) => gs.skills.total() >= 20 },
  { id: 'valley_master', name: 'Master of the Valley', desc: 'Max every skill (60 total).', color: '#fff0a0', check: (gs) => gs.skills.total() >= 60 },
  { id: 'good_neighbor', name: 'Good Neighbor', desc: 'Reach 5 hearts with someone.', color: '#e25f7a', check: (gs) => anyHearts(gs, 5) },
  { id: 'beloved', name: 'Beloved', desc: 'Reach 10 hearts with someone.', color: '#ff8fb0', check: (gs) => anyHearts(gs, 10) },
  { id: 'helping_hand', name: 'Helping Hand', desc: 'Complete 5 quests.', color: '#9cd0ff', check: (gs) => gs.quests.done.length >= 5 },
  { id: 'plant_breeder', name: 'Plant Breeder', desc: 'Engineer your first crop strain.', color: '#9af0d0', check: (gs) => (gs.stats.strainsBred || 0) >= 1 },
  { id: 'geneticist', name: 'Geneticist', desc: 'Engineer 10 unique strains.', color: '#6cd0b0', check: (gs) => (gs.stats.strainsBred || 0) >= 10 },
  { id: 'master_breeder', name: 'Master Breeder', desc: 'Engineer 30 strains.', color: '#aef0d8', check: (gs) => (gs.stats.strainsBred || 0) >= 30 },
  { id: 'the_ancient_green', name: 'The Ancient Green', desc: 'Complete the main story.', color: '#6cd0b0', check: (gs) => gs.quests.done.includes('ancient_green') },
];

export class Achievements {
  constructor(game) { this.game = game; this._t = 0; }
  get unlocked() { return (this.game.gs.flags.achievements ||= []); }
  has(id) { return this.unlocked.includes(id); }

  check(force) {
    if (!this.game.gs) return;
    this._t += 1 / 60;
    if (!force && this._t < 0.4) return;
    this._t = 0;
    for (const a of ACHIEVEMENTS) {
      if (this.has(a.id)) continue;
      try { if (a.check(this.game.gs)) this.unlock(a); } catch {}
    }
  }
  unlock(a) {
    this.unlocked.push(a.id);
    this.game.popups.push({ text: `🏆 ${a.name}`, t: 4.5, color: a.color });
    this.game.audio.sfx('quest');
    this.game.screenFlash(a.color, 0.16);
  }
  list() { return ACHIEVEMENTS.map((a) => ({ ...a, done: this.has(a.id) })); }
  count() { return this.unlocked.length; }
}

function anyHearts(gs, n) {
  for (const id in gs.relationships) if (Math.floor((gs.relationships[id].points || 0) / 250) >= n) return true;
  return false;
}
