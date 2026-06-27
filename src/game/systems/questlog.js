// Quest tracking: progress counters, completion checks, and reward granting.
import { QUESTS, QUEST_BY_ID } from '../data/quests.js';
import { ITEMS } from '../data/items.js';

export class QuestLog {
  constructor(gs) {
    this.gs = gs;
    this.counters = gs.quests.progress; // shared/persisted
    this._metSet = new Set(gs.quests.progress.__met || []);
  }

  ensureCounter(id, def = 0) { if (this.counters[id] == null) this.counters[id] = def; }

  // Activate any quests whose prerequisites are now satisfied.
  refreshAvailable() {
    for (const q of QUESTS) {
      if (this.gs.questDone(q.id) || this.gs.questActive(q.id)) continue;
      if (q.req.every((r) => this.gs.questDone(r))) this.gs.quests.active.push(q.id);
    }
  }

  // --- event hooks ---
  onShip(cropId, count) {
    for (const id of this.gs.quests.active) {
      const q = QUEST_BY_ID[id];
      if (q.type !== 'ship') continue;
      if (q.anyCrop || (Array.isArray(q.items) && q.items.includes(cropId))) {
        this.counters['ship_' + id] = (this.counters['ship_' + id] || 0) + count;
      }
    }
  }
  onHarvest() { this.gs.stats.cropsHarvested++; }
  onClear() { this.counters.clear = (this.counters.clear || 0) + 1; }
  onMeet(npcId) {
    if (this._metSet.has(npcId)) return;
    this._metSet.add(npcId);
    this.counters.__met = [...this._metSet];
    this.counters.meet = this._metSet.size;
  }
  onCatch(fishId) {
    if (!this.gs.stats.fishCaught.includes(fishId)) this.gs.stats.fishCaught.push(fishId);
  }
  onForage(itemId) {
    if (!this.gs.stats.foraged.includes(itemId)) this.gs.stats.foraged.push(itemId);
  }
  onKill() { this.gs.stats.kills++; }
  onMine(depth) { if (depth > this.gs.stats.deepestMine) this.gs.stats.deepestMine = depth; }

  // Check completion of a quest's objective.
  isComplete(q) {
    const gs = this.gs;
    switch (q.type) {
      case 'ship': return (this.counters['ship_' + q.id] || 0) >= q.goal;
      case 'gather': return Object.entries(q.items).every(([id, n]) => gs.inv.count(id) >= n);
      case 'gold':
        if (q.field === 'shipTotal') return gs.stats.shipTotal >= q.goal;
        return gs.player.gold >= q.goal;
      case 'skill': return gs.skills.level(q.skill) >= q.goal;
      case 'catch': return gs.stats.fishCaught.length >= q.goal;
      case 'forage': return gs.stats.foraged.length >= q.goal;
      case 'kill': return gs.stats.kills >= q.goal;
      case 'mine': return gs.stats.deepestMine >= q.goal;
      case 'clear': return (this.counters.clear || 0) >= q.goal;
      case 'meet': return (this.counters.meet || 0) >= q.goal;
      default: return false;
    }
  }

  progressText(q) {
    const gs = this.gs;
    switch (q.type) {
      case 'ship': return `${Math.min(this.counters['ship_' + q.id] || 0, q.goal)}/${q.goal}`;
      case 'gather': return Object.entries(q.items).map(([id, n]) => `${ITEMS[id].name} ${Math.min(gs.inv.count(id), n)}/${n}`).join(', ');
      case 'gold': return `${q.field === 'shipTotal' ? gs.stats.shipTotal : gs.player.gold}/${q.goal}g`;
      case 'skill': return `Lv ${gs.skills.level(q.skill)}/${q.goal}`;
      case 'catch': return `${gs.stats.fishCaught.length}/${q.goal} fish`;
      case 'forage': return `${gs.stats.foraged.length}/${q.goal} kinds`;
      case 'kill': return `${gs.stats.kills}/${q.goal} slain`;
      case 'mine': return `Depth ${gs.stats.deepestMine}/${q.goal}`;
      case 'clear': return `${Math.min(this.counters.clear || 0, q.goal)}/${q.goal}`;
      case 'meet': return `${this.counters.meet || 0}/${q.goal} met`;
      default: return '';
    }
  }

  // Complete & grant rewards. Returns {gold, items, hearts} or null.
  complete(q) {
    const gs = this.gs;
    if (q.type === 'gather') for (const [id, n] of Object.entries(q.items)) gs.inv.remove(id, n);
    const i = gs.quests.active.indexOf(q.id);
    if (i >= 0) gs.quests.active.splice(i, 1);
    if (!gs.quests.done.includes(q.id)) gs.quests.done.push(q.id);
    const reward = q.reward || {};
    if (reward.gold) { gs.player.gold += reward.gold; }
    if (reward.items) for (const [id, n] of Object.entries(reward.items)) gs.inv.add(id, n);
    if (reward.hearts) for (const [npc, h] of Object.entries(reward.hearts)) { if (gs.relationships[npc]) gs.relationships[npc].points += h * 250; }
    this.refreshAvailable();
    return reward;
  }

  // Returns array of newly-completable active quests (for turn-in / auto).
  completable() {
    return this.gs.quests.active.map((id) => QUEST_BY_ID[id]).filter((q) => q && this.isComplete(q));
  }
}
