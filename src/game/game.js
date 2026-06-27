// Game orchestrator: owns state, drives update/render, handles tool use,
// interaction, area transitions, the day cycle, combat, fishing, and UI modes.
import { TILE } from '../engine/spritegen.js';
import { T, TILE_NAMES } from './world/tiles.js';
import { RNG } from '../engine/rng.js';
import { Particles } from '../engine/particles.js';
import { GameState } from './state.js';
import { Player } from './entities/player.js';
import { NPC } from './entities/npc.js';
import { Enemy } from './entities/enemy.js';
import { Assets, buildPlayerSprites } from './assets.js';
import { Fishing } from './systems/fishing.js';
import { QuestLog } from './systems/questlog.js';
import { generateMineLevel } from './world/mapgen.js';
import { CROP_BY_ID } from './data/crops.js';
import { ITEMS } from './data/items.js';
import { NPCS, NPC_BY_ID, giftReaction } from './data/npcs.js';
import { ENEMIES, enemiesForDepth } from './data/enemies.js';
import { QUEST_BY_ID } from './data/quests.js';
import * as Farm from './systems/farming.js';
import { SaveManager } from '../engine/save.js';
import { SKILL_NAMES } from './systems/skills.js';

import { Tutorial } from './systems/tutorial.js';
import { Achievements } from './systems/achievements.js';
import { Genetics } from './systems/genetics.js';
import { HUD } from './ui/hud.js';
import { Title } from './ui/title.js';
import { Dialogue } from './ui/dialogue.js';
import { Shop } from './ui/shop.js';
import { Overlays } from './ui/overlays.js';

// What tool/action each faced thing wants — drives prompts + Smart Tool.
const TARGET_TOOL = {
  tree: 'axe', tree2: 'axe', log: 'axe', stump: 'axe',
  rock: 'pickaxe', ore: 'pickaxe',
  weed: 'scythe',
};

export class Game {
  constructor(renderer, input, audio) {
    this.r = renderer; this.input = input; this.audio = audio;
    this.particles = new Particles();
    this.fishing = new Fishing();
    this.rng = new RNG((Date.now() & 0xffff) + 99);
    this.gs = null; this.player = null; this.quests = null;
    this.npcs = []; this.enemies = [];
    this.mode = 'title';        // title | play | dialogue | shop | overlay | sleep | gameover | charcreate
    this.overlay = null;        // inventory | journal | skills | map | crafting | settings | pause
    this.selSlot = 0;
    this.toasts = []; this.popups = []; this.floaties = [];
    this.fade = { a: 1, dir: -1, cb: null, speed: 2.6 };
    this.dialogue = new Dialogue(this);
    this.shop = new Shop(this);
    this.title = new Title(this);
    this.overlays = new Overlays(this);
    this.tutorial = new Tutorial(this);
    this.achievements = new Achievements(this);
    this.genetics = new Genetics(this);
    this.weatherP = 0;          // weather particle accumulator
    this.tileHover = null;
    this.daySummary = null;
    this.tutorialT = 6;
    this.timeFrozen = false;
    this.menuCooldown = 0;
    this._moveDist = 0;
    this.freezeT = 0;           // hit-stop timer
    this.flashT = 0;            // full-screen flash (level up / quest)
    this.flashColor = '#fff';
    this.settings = SaveManager.loadSettings();
    if (this.settings.smartTool === undefined) this.settings.smartTool = true;
  }

  // ---------------- lifecycle ----------------
  startNewGame(opts) {
    this.gs = new GameState().newGame(opts);
    buildPlayerSprites(this.gs.player.palette);
    this.player = new Player(this.gs);
    this.quests = new QuestLog(this.gs);
    this.quests.refreshAvailable();
    this.genetics.registerAll();
    this.tutorial.start();
    this._enterMode('play');
    this.loadAreaEntities();
    this.audio.playMusic(this.gs.time.musicTrack(this.gs.currentArea()));
    this.toast(`Welcome to ${this.gs.meta.farmName} Farm!`, '#aede6a');
    this.fadeIn();
  }

  loadFromSave(slot) {
    const data = SaveManager.load(slot);
    if (!data) return false;
    this.gs = GameState.load(data);
    buildPlayerSprites(this.gs.player.palette);
    this.player = new Player(this.gs);
    this.quests = new QuestLog(this.gs);
    this.genetics.registerAll();
    this._enterMode('play');
    this.loadAreaEntities();
    this.audio.playMusic(this.gs.time.musicTrack(this.gs.currentArea()));
    this.fadeIn();
    return true;
  }

  saveGame(slot) {
    const ok = SaveManager.save(slot, this.gs.buildSaveData());
    if (ok) this.toast('Game saved.', '#aede6a');
    else this.toast('Save failed!', '#e85f5f');
    return ok;
  }

  _enterMode(m) { this.mode = m; }

  // Populate NPCs (and enemies) for the current area.
  loadAreaEntities() {
    const area = this.gs.currentArea();
    this.npcs = NPCS.filter((n) => (NPC_AREA_OF(n.id) === area.id)).map((n) => {
      const npc = new NPC(n);
      return npc;
    });
    this.enemies = [];
    if (area.spawnsEnemies) this.spawnEnemies(area);
  }

  spawnEnemies(area) {
    const types = enemiesForDepth(area.depth);
    const n = Math.min(3 + Math.floor(area.depth / 2), 9);
    for (let i = 0; i < n; i++) {
      const type = this.rng.pick(types);
      let tx, ty, tries = 0;
      do { tx = this.rng.int(2, area.w - 3); ty = this.rng.int(2, area.h - 3); tries++; }
      while (tries < 40 && (area.solidObjectAt(tx, ty) || Math.hypot(tx - (area.entryTx || 5), ty - (area.entryTy || 5)) < 4));
      this.enemies.push(new Enemy(type, tx * TILE, ty * TILE));
    }
  }

  // ---------------- area transitions ----------------
  fadeOut(cb) { this.fade.dir = 1; this.fade.cb = cb; }
  fadeIn() { this.fade.dir = -1; this.fade.a = 1; }

  warpTo(areaId, tx, ty) {
    this.fadeOut(() => {
      // mine levels are generated/cached on the GameState transiently
      let target = this.gs.areas[areaId] || this.gs.mineLevels[areaId];
      if (!target && areaId.startsWith('mine_')) {
        const depth = parseInt(areaId.split('_')[1], 10);
        target = generateMineLevel(this.gs.seed, depth);
        this.gs.mineLevels[areaId] = target;
        tx = target.entryTx; ty = target.entryTy;
      }
      if (!target) return;
      this.gs.player.area = areaId;
      this.gs.player.x = tx * TILE; this.gs.player.y = ty * TILE - 4;
      this.player = new Player(this.gs);
      this.warpLock = true;   // don't re-trigger until the player steps off the warp
      this.loadAreaEntities();
      this.audio.playMusic(this.gs.time.musicTrack(target));
      this.audio.sfx('door');
      this.areaTitle = { text: target.name, t: 2.6 };
      this.fadeIn();
    });
  }

  // ---------------- main update ----------------
  update(dt) {
    if (this.menuCooldown > 0) this.menuCooldown -= dt;
    // fade animation
    if (this.fade.dir !== 0) {
      this.fade.a += this.fade.dir * this.fade.speed * dt;
      if (this.fade.dir === 1 && this.fade.a >= 1) { this.fade.a = 1; const cb = this.fade.cb; this.fade.cb = null; this.fade.dir = 0; if (cb) cb(); }
      if (this.fade.dir === -1 && this.fade.a <= 0) { this.fade.a = 0; this.fade.dir = 0; }
    }
    this.updateToasts(dt);

    switch (this.mode) {
      case 'title': case 'charcreate': this.title.update(dt); break;
      case 'play': this.updatePlay(dt); break;
      case 'dialogue': this.dialogue.update(dt); this.updateAmbient(dt); break;
      case 'shop': this.shop.update(dt); break;
      case 'overlay': this.overlays.update(dt); break;
      case 'sleep': this.updateSleep(dt); break;
      case 'gameover': if (this.input.justPressed('confirm') || this.input.mouse.pressed) this.acknowledgeFaint(); break;
    }
  }

  // ambient world ticking while a dialogue/box is open (npc anim, particles)
  updateAmbient(dt) {
    const area = this.gs.currentArea();
    for (const npc of this.npcs) npc.update(dt, area, true);
    this.particles.update(dt);
    this.updateFloaties(dt);
    this.r.cam.update(dt);
  }

  updatePlay(dt) {
    const gs = this.gs, area = gs.currentArea();
    // hit-stop: briefly freeze the world for impact weight
    if (this.freezeT > 0) { this.freezeT -= dt; this.particles.update(dt); this.updateFloaties(dt); this.r.cam.update(dt); return; }
    if (this.flashT > 0) this.flashT -= dt;
    const fishingActive = this.fishing.state !== 'idle' && this.fishing.state !== 'done';

    // open menus
    if (!fishingActive && this.menuCooldown <= 0) {
      if (this.input.justPressed('inventory')) return this.openOverlay('inventory');
      if (this.input.justPressed('journal')) return this.openOverlay('journal');
      if (this.input.justPressed('map')) return this.openOverlay('map');
      if (this.input.justPressed('menu')) return this.openOverlay('pause');
    }

    // time advances while playing
    if (!this.timeFrozen) {
      const before = gs.time.day, beforeMin = gs.time.minute;
      gs.time.advance(dt);
      gs.meta.playtime += dt;
      if (gs.time.pastBedtime && beforeMin < gs.time.minute) this.passOut('exhaustion');
    }

    // hotbar selection
    for (let i = 0; i < 9; i++) if (this.input.justPressed('slot' + (i + 1))) this.selSlot = i;
    if (this.input.justPressed('slot10')) this.selSlot = 9;
    if (this.input.mouse.wheel) this.selSlot = (this.selSlot + this.input.mouse.wheel + 12) % 12;
    if (this.input.justPressed('nextTool')) this.selSlot = (this.selSlot + 1) % 12;
    if (this.input.justPressed('prevTool')) this.selSlot = (this.selSlot + 11) % 12;

    // fishing minigame intercepts use input
    if (fishingActive) { this.updateFishing(dt); }
    else {
      // actions
      if (this.input.justPressed('use') || this.input.mouse.pressed) this.useSelected();
      if (this.input.justPressed('interact')) this.interact();
    }

    // player + entities
    const busy = fishingActive;
    const px0 = this.player.x, py0 = this.player.y;
    this.player.update(dt, this.input, area, busy);
    this._moveDist += Math.hypot(this.player.x - px0, this.player.y - py0);
    if (this.player.consumeStep() && !busy) {
      this.audio.sfx('step');
      const ft = area.tileAt(this.player.tileX, this.player.tileY);
      this.particles.spawn({ x: this.player.cx, y: this.player.feetY, vx: 0, vy: -8, life: 0.3, size: 1.5, color: '#c8b890', grav: 30, shrink: true });
    }

    // warp check (only when walking, not fishing). warpLock prevents an entry
    // tile that sits next to a warp from instantly bouncing the player back.
    if (!busy) {
      const wp = area.warpAt(this.player.tileX, this.player.tileY);
      if (this.warpLock) { if (!wp) this.warpLock = false; }
      else if (wp) this.warpTo(wp.to, wp.tx, wp.ty);
    }

    // NPCs
    for (const npc of this.npcs) npc.update(dt, area, false);
    // Enemies + combat
    this.updateEnemies(dt, area);
    // energy/health passive
    this.updateVitals(dt);

    // particles & misc
    this.particles.update(dt);
    this.updateFloaties(dt);
    this.spawnWeather(dt, area);
    this.spawnAmbient(dt, area);
    this.ambientAudio(dt, area);

    // camera with subtle look-ahead in the facing direction
    const look = { up: [0, -10], down: [0, 10], left: [-12, 0], right: [12, 0] }[this.player.faceDir] || [0, 0];
    this.r.cam.follow(this.player.cx + look[0], this.player.feetY - 6 + look[1], this.r.W, this.r.H, area.pxW, area.pxH);
    this.r.cam.update(dt);

    // guidance & meta systems
    this.tutorial.update(dt);
    this.achievements.check();
    if (this.tutorialT > 0) this.tutorialT -= dt;
  }

  hitStop(dur = 0.05) { this.freezeT = Math.max(this.freezeT, dur); }
  screenFlash(color = '#fff', dur = 0.18) { this.flashColor = color; this.flashT = Math.max(this.flashT, dur); }

  updateVitals(dt) {
    const p = this.gs.player;
    if (p.energy <= 0) {
      // drain health slowly when exhausted
      p._exDrain = (p._exDrain || 0) + dt;
      if (p._exDrain > 1) { p._exDrain = 0; p.health = Math.max(1, p.health - 1); }
    }
    if (p.health <= 0 && this.gs.currentArea().kind === 'cave') this.passOut('fainted');
  }

  // ---------------- tool / item use ----------------
  selectedItem() { return this.gs.inv.slots[this.selSlot]; }

  useSelected() {
    const slot = this.selectedItem();
    const gs = this.gs, area = gs.currentArea();
    const def = slot ? ITEMS[slot.id] : null;

    // Intentional held-item uses always take priority.
    if (def && def.type === 'seed') return this.plant(slot, def, area);
    if (def && def.placeable) return this.placeObject(slot, def, area);
    if (slot && slot.id === 'recall_charm') return this.useRecall();
    if (def && def.type === 'food' && def.edible) return this.eat(slot, def);

    // Smart Tool: act on whatever you're facing with the correct tool.
    if (this.settings.smartTool) {
      if (this.trySmart(area)) return;
    }
    // Manual / fallback behaviour.
    if (def && def.type === 'tool') return this.useTool(def.tool, area);
    if (def && def.edible) return this.eat(slot, def);          // eat a raw crop/fish/forage
  }

  // Equip the inventory tool with the given id (moves hotbar selection to it).
  equipTool(toolId) {
    const i = this.gs.inv.slots.findIndex((s) => s && s.id === toolId);
    if (i >= 0) this.selSlot = i;
    return i >= 0;
  }

  // Smart Tool resolution — returns true if it handled the press.
  trySmart(area) {
    const t = this.getFacedTarget();
    if (!t) return false;
    if (t.tool) {
      if (this.gs.inv.has(t.tool)) { this.equipTool(t.tool); this.useTool(t.tool, area); return true; }
      this.toast(`You need a ${ITEMS[t.tool].name} for that.`, '#e8b35f'); this.audio.sfx('error'); return true;
    }
    if (t.key === 'e') { this.interact(); return true; }
    return false;
  }

  // Inspect what the player is facing and what action/tool applies to it.
  // Used for the on-screen prompt AND for Smart Tool routing.
  getFacedTarget() {
    const area = this.gs.currentArea();
    const { tx, ty } = this.player.facingTile();
    // 1) nearby villager
    const npc = this.facingNPC();
    if (npc) return { action: 'Talk', key: 'e', npc, x: npc.cx, y: npc.y };
    // 2) faced object
    const obj = area.objectAt(tx, ty);
    if (obj && !obj.hidden) {
      const wx = tx * TILE + 8, wy = ty * TILE;
      switch (obj.type) {
        case 'tree': case 'tree2': case 'log': case 'stump': return { action: 'Chop', tool: 'axe', key: 'space', obj, tx, ty, x: wx, y: wy - 18 };
        case 'rock': case 'ore': if (obj.wall) return null; return { action: 'Mine', tool: 'pickaxe', key: 'space', obj, tx, ty, x: wx, y: wy - 8 };
        case 'weed': return { action: 'Clear', tool: 'scythe', key: 'space', obj, tx, ty, x: wx, y: wy };
        case 'forage': return { action: 'Gather', key: 'e', obj, tx, ty, x: wx, y: wy };
        case 'bed': return { action: 'Sleep', key: 'e', obj, x: wx, y: wy };
        case 'kitchen': return { action: 'Cook', key: 'e', obj, x: wx, y: wy };
        case 'chest': return { action: 'Open', key: 'e', obj, x: wx, y: wy };
        case 'bin': return { action: 'Ship', key: 'e', obj, x: wx, y: wy };
        case 'bench': return { action: 'Breed', key: 'e', obj, x: wx, y: wy - 6 };
        case 'ladder': return { action: 'Descend', key: 'e', obj, x: wx, y: wy };
        case 'ladder_up': return { action: 'Climb', key: 'e', obj, x: wx, y: wy };
        case 'sign': return { action: 'Read', key: 'e', obj, x: wx, y: wy };
        case 'building':
          if (obj.shop) return { action: 'Shop', key: 'e', obj, x: wx, y: wy - 8 };
          if (obj.warp) return { action: 'Enter', key: 'e', obj, x: wx, y: wy - 8 };
          return null;
      }
    }
    // 3) crop plot (faced or standing)
    const plot = area.plotAt(tx, ty) || area.plotAt(this.player.tileX, this.player.tileY);
    if (plot) {
      const ptx = plot.tx, pty = plot.ty, wx = ptx * TILE + 8, wy = pty * TILE;
      if (Farm.isHarvestable(plot)) return { action: 'Harvest', key: 'e', plot, tx: ptx, ty: pty, x: wx, y: wy - 14 };
      if (plot.dead) return { action: 'Clear', key: 'e', plot, tx: ptx, ty: pty, x: wx, y: wy };
      if (plot.cropId && !plot.watered) return { action: 'Water', tool: 'wateringcan', key: 'space', plot, tx: ptx, ty: pty, x: wx, y: wy };
      if (!plot.cropId && !plot.watered) return { action: 'Water', tool: 'wateringcan', key: 'space', plot, tx: ptx, ty: pty, x: wx, y: wy, soft: true };
    }
    // 4) water -> fishing
    if (area.isWater(tx, ty)) return { action: 'Fish', tool: 'fishingrod', key: 'space', tx, ty, x: tx * TILE + 8, y: ty * TILE };
    // 5) tillable grass
    if (Farm.canTill(area, tx, ty)) return { action: 'Till', tool: 'hoe', key: 'space', tx, ty, x: tx * TILE + 8, y: ty * TILE, soft: true };
    return null;
  }

  useTool(tool, area) {
    const gs = this.gs, p = gs.player;
    const { tx, ty } = this.player.facingTile();
    const energyCost = { hoe: 2, wateringcan: 2, axe: 4, pickaxe: 4, scythe: 2, sword: 1, fishingrod: 0 }[tool] ?? 2;

    if (tool === 'fishingrod') {
      // need to face water
      if (area.isWater(tx, ty) || area.isWater(tx, ty + 1)) {
        this.player.swing(0.3);
        const loc = this.fishingLocation(area);
        this.fishing.start(loc, gs.time.season, gs.skills.level('fishing'));
        this.toast('Casting…', '#9cd0ff');
        this.audio.sfx('splash');
      } else this.toast('Face the water to fish.', '#ccc');
      return;
    }

    if (p.energy < energyCost) { this.audio.sfx('error'); this.toast('Too exhausted!', '#e85f5f'); return; }

    this.player.swing(0.34);
    this.player.swingFx = ['axe', 'pickaxe', 'scythe', 'sword'].includes(tool);
    const obj = area.objectAt(tx, ty);

    if (tool === 'hoe') {
      if (Farm.tillTile(area, tx, ty)) { p.energy -= energyCost; this.audio.sfx('hoe'); this.dust(tx, ty, '#8a6038'); }
      else this.audio.sfx('hoe');
    } else if (tool === 'wateringcan') {
      if (Farm.waterTile(area, tx, ty)) { p.energy -= energyCost; this.audio.sfx('water'); this.splash(tx, ty); }
      else this.audio.sfx('water');
    } else if (tool === 'axe') {
      if (obj && (obj.type === 'tree' || obj.type === 'tree2' || obj.type === 'log' || obj.type === 'stump')) {
        p.energy -= energyCost; this.chopObject(obj, area, tx, ty);
      } else { this.audio.sfx('chop'); this.toolMissHint(obj); }
    } else if (tool === 'pickaxe') {
      if (obj && (obj.type === 'rock' || obj.type.startsWith('ore'))) {
        if (obj.wall) { this.audio.sfx('mine'); return; }
        p.energy -= energyCost; this.mineObject(obj, area, tx, ty);
      } else { this.audio.sfx('mine'); this.toolMissHint(obj); }
    } else if (tool === 'scythe') {
      if (obj && obj.type === 'weed') { area.removeObject(obj); this.gs.flags.everForaged = true; this.gs.inv.add('fiber', 1); this.floatItem('fiber', tx, ty); this.audio.sfx('swing'); this.quests.onClear(); this.grantXp('foraging', 2); this.checkQuests(); }
      else if (obj && obj.type === 'forage') { this.pickForage(obj, area, tx, ty); }
      else this.audio.sfx('swing');
      p.energy -= 0; // scythe is free-ish
    } else if (tool === 'sword') {
      this.swordAttack(area);
    }
  }

  // When the player swings the wrong tool at something, point them to the right one.
  toolMissHint(obj) {
    if (!obj) return;
    const need = TARGET_TOOL[obj.type] || (obj.type === 'ore' ? 'pickaxe' : null);
    if (!need) return;
    const slot = this.gs.inv.slots.findIndex((s) => s && s.id === need);
    const where = slot >= 0 ? ` (slot ${(slot + 1) % 10})` : ' — buy one from the shop';
    this.toast(`Use the ${ITEMS[need].name}${where} for that.`, '#e8b35f', 2.6);
  }

  swordAttack(area) {
    this.audio.sfx('swing');
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.player.faceDir];
    const ax = this.player.cx + d[0] * 14, ay = this.player.feetY - 6 + d[1] * 14;
    const dmg = 6 + this.gs.skills.level('combat') * 2 + (this.gs.player.toolLevels.sword || 0) * 3;
    let hitAny = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.cx - ax, e.cy - ay) < 22) {
        const res = e.hit(dmg, this.player.cx, this.player.feetY);
        this.audio.sfx('hit');
        this.floatText(`${dmg}`, e.cx, e.cy - 4, '#fff');
        this.particles.burst(e.cx, e.cy, 6, { color: ['#fff', '#ffd24e'], speed: 70, life: 0.3, size: 2 });
        hitAny = true;
        if (res === 'dead') this.killEnemy(e, area);
      }
    }
    if (hitAny) { this.hitStop(0.045); this.r.cam.shake(2, 0.12); }
  }

  killEnemy(e, area) {
    this.audio.sfx('enemydie');
    this.particles.burst(e.cx, e.cy, 12, { color: ['#8fd86a', '#fff', '#3f8a36'], speed: 80, life: 0.5, size: 2 });
    const def = e.def;
    this.grantXp('combat', def.xp);
    this.quests.onKill();
    const gold = this.rng.int(def.gold[0], def.gold[1]);
    this.gs.player.gold += gold; this.floatText(`+${gold}g`, e.cx, e.cy, '#ffd24e');
    for (const drop of def.drops) {
      if (this.rng.next() < drop.chance) {
        const n = this.rng.int(drop.min, drop.max);
        this.gs.inv.add(drop.id, n); this.floatItem(drop.id, Math.floor(e.cx / TILE), Math.floor(e.cy / TILE));
      }
    }
    this.checkQuests();
  }

  chopObject(obj, area, tx, ty) {
    obj.hp = (obj.hp ?? 4) - (1 + (this.gs.player.toolLevels.axe || 0));
    obj.hitAt = performance.now();
    this.audio.sfx('chop');
    this.dust(tx, ty, '#9c7142');
    this.r.cam.shake(1.5, 0.12);
    if (obj.hp <= 0) {
      area.removeObject(obj);
      this.gs.flags.everChopped = true;
      const amt = obj.type === 'log' ? 4 : obj.type === 'stump' ? 3 : this.rng.int(3, 6);
      this.gs.inv.add('wood', amt); this.floatItem('wood', tx, ty, amt);
      if (this.rng.bool(0.3)) { this.gs.inv.add('sap', 1); }
      if (obj.type === 'tree' || obj.type === 'tree2') { this.audio.sfx('treefall'); this.grantXp('foraging', 8); if (this.rng.bool(0.5)) area.addObject({ type: 'stump', tx, ty, hp: 2 }); }
      else this.grantXp('foraging', 3);
      this.particles.burst(tx * TILE + 8, ty * TILE + 8, 10, { color: ['#9c7142', '#6cae44'], speed: 50, life: 0.5, size: 2 });
      this.quests.onClear(); this.checkQuests();
    }
  }

  mineObject(obj, area, tx, ty) {
    obj.hp = (obj.hp ?? 2) - (1 + (this.gs.player.toolLevels.pickaxe || 0));
    obj.hitAt = performance.now();
    this.audio.sfx('mine');
    this.dust(tx, ty, '#a4a0a9');
    this.r.cam.shake(1.5, 0.12);
    if (obj.hp <= 0) {
      area.removeObject(obj);
      this.audio.sfx('rockbreak');
      if (obj.ore) {
        const oreItem = { copper: 'copper', iron: 'iron', gold: 'gold', coal: 'coal', gem: 'gem', crystal: 'crystal' }[obj.ore];
        const n = this.rng.int(1, 3);
        this.gs.inv.add(oreItem, n); this.floatItem(oreItem, tx, ty, n);
        if (!this.gs.stats.mineralsSeen.includes(oreItem)) this.gs.stats.mineralsSeen.push(oreItem);
        this.grantXp('mining', obj.ore === 'gem' || obj.ore === 'crystal' ? 12 : 6);
        if (this.rng.bool(0.4)) { this.gs.inv.add('stone', 1); }
      } else {
        const n = this.rng.int(1, 2);
        this.gs.inv.add('stone', n); this.floatItem('stone', tx, ty, n);
        this.grantXp('mining', 3);
        if (this.rng.bool(0.1)) this.gs.inv.add('clay', 1);
      }
      this.particles.burst(tx * TILE + 8, ty * TILE + 8, 9, { color: ['#a4a0a9', '#6c6873'], speed: 50, life: 0.5, size: 2 });
      this.quests.onClear(); this.checkQuests();
    }
  }

  pickForage(obj, area, tx, ty) {
    area.removeObject(obj);
    this.gs.flags.everForaged = true;
    const item = obj.item || 'wild_berry';
    this.gs.inv.add(item, 1); this.floatItem(item, tx, ty);
    this.audio.sfx('pickup');
    this.grantXp('foraging', 5);
    this.quests.onForage(item); this.quests.onClear();
    this.particles.burst(tx * TILE + 8, ty * TILE + 8, 6, { color: ['#fff', '#aede6a'], speed: 40, life: 0.4, size: 1.5 });
    this.checkQuests();
  }

  plant(slot, def, area) {
    const { tx, ty } = this.player.facingTile();
    const plot = area.plotAt(tx, ty);
    if (!plot) { this.toast('Till the soil first (hoe).', '#ccc'); this.audio.sfx('error'); return; }
    if (plot.cropId) { this.toast('Something already grows here.', '#ccc'); this.audio.sfx('error'); return; }
    const crop = CROP_BY_ID[def.cropId];
    if (!crop.season.includes(this.gs.time.season) && crop.season.length < 4) {
      this.toast(`${crop.name} won't grow this season.`, '#e8b35f'); this.audio.sfx('error'); return;
    }
    const gd = def.strainId ? this.genetics.growDaysFor(this.gs.strains[def.strainId], crop) : null;
    if (Farm.plantSeed(area, tx, ty, def.cropId, def.strainId || null, gd)) {
      this.gs.inv.remove(slot.id, 1);
      this.audio.sfx('plant');
      const pc = def.strainId ? [ITEMS['st_crop_' + def.strainId]?.produce?.c || '#9ad96a', '#fff'] : ['#6cae44', '#9ad96a'];
      this.particles.burst(tx * TILE + 8, ty * TILE + 10, 5, { color: pc, speed: 30, life: 0.4, size: 1.5 });
    }
  }

  placeObject(slot, def, area) {
    const { tx, ty } = this.player.facingTile();
    if (area.objectAt(tx, ty) || area.isWater(tx, ty)) { this.audio.sfx('error'); this.toast("Can't place there.", '#ccc'); return; }
    const map = { stone_path: () => area.setTile(tx, ty, T.stone_floor) };
    if (slot.id === 'stone_path') { area.setTile(tx, ty, T.stone_floor); }
    else area.addObject({ type: slot.id, tx, ty, fw: 1, fh: 1, solid: def.id !== 'sprinkler' && def.id !== 'torch', items: slot.id === 'chest' ? [] : undefined });
    this.gs.inv.remove(slot.id, 1);
    this.audio.sfx('confirm');
  }

  useRecall() {
    if (this.gs.flags.recallUsedDay === this.gs.time.totalDay) { this.toast('The charm is spent for today.', '#b59cff'); this.audio.sfx('error'); return; }
    this.gs.flags.recallUsedDay = this.gs.time.totalDay;
    this.audio.sfx('confirm');
    this.particles.burst(this.player.cx, this.player.feetY - 8, 14, { color: ['#b59cff', '#fff', '#d8c0ff'], speed: 70, life: 0.6, size: 2 });
    this.warpTo('farm', 6, 6);
  }

  eat(slot, def) {
    const p = this.gs.player;
    if (def.type === 'crop') { /* allow eating raw */ }
    p.energy = Math.min(p.maxEnergy, p.energy + (def.edible.energy || 0));
    p.health = Math.min(p.maxHealth, p.health + (def.edible.health || 0));
    this.gs.inv.remove(slot.id, 1);
    this.audio.sfx('eat');
    this.floatText(`+${def.edible.energy || 0} energy`, this.player.cx, this.player.y, '#aede6a');
    this.particles.burst(this.player.cx, this.player.y + 6, 5, { color: ['#aede6a', '#fff'], speed: 30, life: 0.4, size: 1.5, up: 10 });
  }

  // ---------------- interaction (E) ----------------
  interact() {
    const gs = this.gs, area = gs.currentArea();
    // NPC?
    const npc = this.facingNPC();
    if (npc) { this.talkTo(npc); return; }
    const { tx, ty } = this.player.facingTile();
    const obj = area.objectAt(tx, ty) || area.objectAt(this.player.tileX, this.player.tileY);

    if (obj) {
      if (obj.type === 'bed') return this.promptSleep();
      if (obj.type === 'kitchen') return this.openOverlay('crafting', { tab: 'cook' });
      if (obj.type === 'chest') return this.openChest(obj);
      if (obj.type === 'ladder') return this.descendMine(obj);
      if (obj.type === 'ladder_up') return this.ascendMine(obj);
      if (obj.type === 'sign' && obj.text) { this.toast(obj.text, '#e8d8a0', 3); this.audio.sfx('select'); return; }
      if (obj.type === 'building') {
        if (obj.shop) { this.openShop(obj.shop); return; }
        if (obj.warp) { this.warpTo(obj.warp.to, obj.warp.tx, obj.warp.ty); return; }
      }
      if (obj.type === 'bin') return this.openShippingBin();
      if (obj.type === 'bench') return this.openBreeding();
      if (obj.type === 'forage') return this.pickForage(obj, area, obj.tx, obj.ty);
      // harvest crop on a plot at this tile
    }
    // harvest crop if facing/standing on a harvestable plot
    const plot = area.plotAt(tx, ty) || area.plotAt(this.player.tileX, this.player.tileY);
    if (plot && Farm.isHarvestable(plot)) return this.harvest(plot, area);
    if (plot && plot.dead) { Farm.clearPlot(area, plot.tx, plot.ty); this.toast('Cleared dead crop.', '#ccc'); return; }
  }

  harvest(plot, area) {
    const res = Farm.harvestPlot(area, plot.tx, plot.ty, this.rng, this.gs.skills.level('farming') * 0.1);
    if (!res) return;
    // Strain crops yield their engineered produce (+ yield-gene bonus).
    let outId = res.cropId, qty = res.qty;
    if (res.strainId && this.gs.strains[res.strainId]) {
      outId = 'st_crop_' + res.strainId;
      qty += Math.round(this.gs.strains[res.strainId].genes.yield || 0);
    }
    this.gs.inv.add(outId, qty);
    this.floatItem(outId, plot.tx, plot.ty, qty, res.quality);
    this.audio.sfx('harvest');
    if (!this.gs.stats.cropsSeen.includes(res.cropId)) this.gs.stats.cropsSeen.push(res.cropId);
    this.grantXp('farming', res.xp);
    this.quests.onHarvest();
    this.particles.burst(plot.tx * TILE + 8, plot.ty * TILE + 8, 8, { color: ['#aede6a', '#fff', '#6cae44'], speed: 50, life: 0.5, size: 2, up: 14 });
    this.checkQuests();
  }

  facingNPC() {
    const px = this.player.cx, py = this.player.feetY;
    for (const npc of this.npcs) {
      if (Math.hypot(npc.cx - px, npc.feetY - py) < 26) return npc;
    }
    return null;
  }

  talkTo(npc) {
    this.dialogue.open(npc);
    this.mode = 'dialogue';
    this.audio.sfx('select');
  }

  // ---------------- shop / chest / bin ----------------
  openShop(kind) { this.shop.open(kind); this.mode = 'shop'; this.audio.sfx('open'); }
  openShippingBin() { this.overlays.open('shipping'); this.mode = 'overlay'; this.overlay = 'shipping'; this.audio.sfx('open'); }
  openBreeding() { this.overlays.open('breeding'); this.mode = 'overlay'; this.overlay = 'breeding'; this.audio.sfx('open'); }
  openChest(obj) { this.overlays.open('chest', { chest: obj }); this.mode = 'overlay'; this.overlay = 'chest'; this.audio.sfx('open'); }

  openOverlay(name, opts) { if (name === 'journal') this.gs.flags.openedJournal = true; this.overlays.open(name, opts); this.mode = 'overlay'; this.overlay = name; this.audio.sfx('open'); this.menuCooldown = 0.2; }
  closeOverlay() { this.mode = 'play'; this.overlay = null; this.audio.sfx('close'); this.menuCooldown = 0.2; }

  // ---------------- mine ----------------
  descendMine(obj) {
    const depth = obj.mineDown || 1;
    this.warpTo('mine_' + depth, 0, 0);
    this.quests.onMine(depth);
    setTimeout(() => this.checkQuests(), 100);
  }
  ascendMine(obj) {
    const depth = obj.mineUp || 1;
    if (depth <= 1) this.warpTo('mine_entrance', 9, 8);
    else this.warpTo('mine_' + (depth - 1), 0, 0);
  }

  updateEnemies(dt, area) {
    if (!area.spawnsEnemies) return;
    for (const e of this.enemies) {
      e.update(dt, this.player, area);
      if (e.touching(this.player)) {
        if (this.player.hurt(e.def.dmg, e.cx, e.cy)) { this.audio.sfx('hurt'); this.r.cam.shake(3, 0.2); this.screenFlash('#e85f5f', 0.14); this.hitStop(0.04); this.floatText(`-${e.def.dmg}`, this.player.cx, this.player.y, '#ff6b6b'); }
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  // ---------------- vitals / fainting ----------------
  passOut(reason) {
    if (this.mode === 'sleep' || this.mode === 'gameover') return;
    const lost = Math.min(this.gs.player.gold, Math.floor(this.gs.player.gold * 0.1));
    this.gs.player.gold -= lost;
    this.faintReason = reason; this.faintLost = lost;
    this.mode = 'gameover';
    this.audio.sfx('hurt'); this.audio.stopMusic();
  }
  acknowledgeFaint() {
    // wake at home next morning
    this.gs.player.area = 'farm';
    this.gs.player.x = 5 * TILE; this.gs.player.y = 6 * TILE;
    this.player = new Player(this.gs);
    this.doSleep(true);
  }

  promptSleep() { this.overlays.open('sleepconfirm'); this.mode = 'overlay'; this.overlay = 'sleepconfirm'; }

  doSleep(fainted = false) {
    // process new day
    const gs = this.gs;
    const summary = { earnings: 0, items: [], levelups: [], newDay: 0 };
    // sell shipping bin
    for (const it of gs.shippingBin) {
      const price = (ITEMS[it.id]?.sellPrice || 0) * it.count;
      summary.earnings += price; gs.stats.shipTotal += price; gs.stats.goldEarned += price;
      // ship counts for quests
      this.quests.onShip(it.id, it.count);
    }
    gs.player.gold += summary.earnings;
    gs.shippingBin = [];
    // advance time + farms
    gs.time.nextDay(this.rng);
    for (const a of Object.values(gs.areas)) if (a.kind === 'farm') Farm.advanceFarm(a, gs.time, this.rng);
    // regrow forage/weeds a bit on farm & forest
    this.dailyRespawn();
    // reset relationships daily flags
    const weekly = (gs.time.totalDay % 7) === 1;
    for (const id in gs.relationships) { gs.relationships[id].talkedToday = false; gs.relationships[id].giftedToday = false; if (weekly) gs.relationships[id].giftsThisWeek = 0; }
    // restore energy/health
    gs.player.energy = gs.player.maxEnergy;
    gs.player.health = fainted ? Math.floor(gs.player.maxHealth * 0.5) : gs.player.maxHealth;
    gs.stats.daysPlayed++;
    // mine levels reset each day
    gs.mineLevels = {};
    this.checkQuests();
    summary.newDay = gs.time.day;
    this.daySummary = summary;
    this.mode = 'sleep';
    this.sleepT = 0;
    this.audio.sfx('sleep');
    // autosave
    SaveManager.save(gs._slot ?? 0, gs.buildSaveData());
    gs._slot = gs._slot ?? 0;
    // refresh entities & music after a beat
    this.loadAreaEntities();
    this.audio.stopMusic();
  }

  dailyRespawn() {
    const gs = this.gs;
    const farm = gs.areas.farm;
    // occasional weed spread on farm
    for (let i = 0; i < 3; i++) {
      const tx = this.rng.int(2, farm.w - 3), ty = this.rng.int(8, farm.h - 4);
      if (!farm.objectAt(tx, ty) && farm.tileAt(tx, ty) === T.grass) farm.addObject({ type: 'weed', tx, ty, v: this.rng.int(0, 2) });
    }
    // forest forage respawn
    const forest = gs.areas.forest;
    let forageCount = forest.objects.filter((o) => o.type === 'forage').length;
    while (forageCount < 30) {
      const tx = this.rng.int(1, forest.w - 2), ty = this.rng.int(1, forest.h - 2);
      if (!forest.objectAt(tx, ty) && forest.tileAt(tx, ty) === T.grass) {
        forest.addObject({ type: 'forage', tx, ty, fk: this.rng.pick(['mushroom', 'berry', 'flower', 'leek']), item: this.seasonalForage() });
        forageCount++;
      } else break;
    }
  }
  seasonalForage() {
    const s = this.gs.time.season;
    const tables = [['daffodil', 'wild_leek', 'dandelion'], ['wild_berry', 'blackberry'], ['wild_mushroom', 'hazelnut'], ['snowdrop', 'wild_mushroom']];
    return this.rng.pick(tables[s]);
  }

  updateSleep(dt) {
    this.sleepT = (this.sleepT || 0) + dt;
    if (this.sleepT > 0.8 && (this.input.justPressed('confirm') || this.input.justPressed('use') || this.input.mouse.pressed)) {
      this.mode = 'play';
      this.daySummary = null;
      this.audio.sfx('newday');
      this.audio.playMusic(this.gs.time.musicTrack(this.gs.currentArea()));
      this.fadeIn();
    }
  }

  // ---------------- fishing ----------------
  fishingLocation(area) {
    if (area.id === 'beach') return 'ocean';
    if (area.id === 'forest') return 'river';
    if (area.kind === 'cave') return 'cave';
    return 'pond';
  }
  updateFishing(dt) {
    const res = this.fishing.update(dt, this.input);
    if (res === 'hooked') this.audio.sfx('fish_bite');
    if (res === 'caught') {
      const fish = this.fishing.result;
      this.gs.inv.add(fish.id, 1);
      this.floatItem(fish.id, this.player.tileX, this.player.tileY - 1);
      this.audio.sfx('fish_catch');
      this.grantXp('fishing', 6 + fish.difficulty);
      this.quests.onCatch(fish.id);
      this.toast(`Caught a ${fish.name}!`, '#9cd0ff');
      this.checkQuests();
      this.fishing.state = 'idle';
    }
    if (res === 'missed') { this.toast(this.fishing.message, '#ccc'); }
    if (this.fishing.state === 'done' || this.fishing.state === 'idle') this.fishing.state = 'idle';
    // cancel
    if (this.input.justPressed('menu')) this.fishing.state = 'idle';
  }

  // ---------------- skills & quests ----------------
  grantXp(skill, amt) {
    const lvl = this.gs.skills.addXp(skill, amt);
    if (lvl != null) {
      this.audio.sfx('levelup');
      this.popups.push({ text: `${SKILL_NAMES[skill]} Level ${lvl}!`, t: 3.2, color: '#ffe46b' });
      this.screenFlash('#ffe46b', 0.16);
      if (this.particles) this.particles.burst(this.player.cx, this.player.feetY - 10, 16, { color: ['#ffe46b', '#fff', '#aede6a'], speed: 70, life: 0.7, size: 2, up: 20 });
      this.applyLevelPerks(skill, lvl);
      this.checkQuests();
    }
  }
  applyLevelPerks(skill, lvl) {
    const p = this.gs.player;
    if (skill === 'farming' && lvl % 2 === 0) p.maxEnergy += 10;
    if (skill === 'combat') { p.maxHealth += 5; }
    if (skill === 'foraging' && lvl % 3 === 0) p.maxEnergy += 8;
    // tool upgrades at certain levels
    if (skill === 'farming' && lvl === 4) p.toolLevels.hoe = 1;
    if (skill === 'mining' && lvl === 4) p.toolLevels.pickaxe = 1;
    if (skill === 'foraging' && lvl === 4) p.toolLevels.axe = 1;
    if (skill === 'combat' && lvl === 5) p.toolLevels.sword = 1;
  }
  checkQuests() {
    const done = this.quests.completable();
    for (const q of done) {
      const reward = this.quests.complete(q);
      this.audio.sfx('quest');
      this.screenFlash('#aede6a', 0.18);
      let msg = `Quest complete: ${q.title}!`;
      if (reward.gold) msg += ` +${reward.gold}g`;
      this.popups.push({ text: msg, t: 4, color: '#aede6a' });
    }
  }

  // ---------------- shipping bin helper ----------------
  shipItem(slotIndex, count) {
    const slot = this.gs.inv.slots[slotIndex];
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (def.type === 'tool') return;
    const taken = this.gs.inv.removeSlot(slotIndex, count);
    if (!taken) return;
    const existing = this.gs.shippingBin.find((b) => b.id === taken.id);
    if (existing) existing.count += taken.count; else this.gs.shippingBin.push({ id: taken.id, count: taken.count });
    this.audio.sfx('select');
  }

  // ---------------- gifting ----------------
  giveGift(npc, slotIndex) {
    const rel = this.gs.relationships[npc.id];
    const slot = this.gs.inv.slots[slotIndex];
    if (!slot) return;
    if (rel.giftsThisWeek >= 2) { this.toast(`${npc.name} has had enough gifts this week.`, '#ccc'); return; }
    if (rel.giftedToday) { this.toast(`Already gave ${npc.name} a gift today.`, '#ccc'); return; }
    const def = ITEMS[slot.id];
    if (def.type === 'tool') { this.toast("You can't gift a tool.", '#ccc'); return; }
    const reaction = giftReaction(npc.def, slot.id);
    rel.points = Math.max(0, rel.points + reaction.pts);
    rel.giftedToday = true; rel.giftsThisWeek++;
    this.gs.inv.remove(slot.id, 1);
    this.audio.sfx(reaction.pts > 0 ? 'confirm' : 'error');
    this.dialogue.showGiftReaction(npc, reaction);
  }

  // ---------------- toasts / popups / floaties ----------------
  toast(text, color = '#fff', dur = 2.4) { this.toasts.push({ text, color, t: dur, max: dur }); if (this.toasts.length > 4) this.toasts.shift(); }
  updateToasts(dt) {
    if (this.areaTitle) { this.areaTitle.t -= dt; if (this.areaTitle.t <= 0) this.areaTitle = null; }
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);
    for (const p of this.popups) p.t -= dt;
    this.popups = this.popups.filter((p) => p.t > 0);
  }
  floatItem(id, tx, ty, count = 1, quality = 0) {
    this.floaties.push({ icon: id, x: tx * TILE + 8, y: ty * TILE, vy: -18, t: 1.1, count, quality, kind: 'item' });
  }
  floatText(text, x, y, color) { this.floaties.push({ text, x, y, vy: -16, t: 1.0, color, kind: 'text' }); }
  updateFloaties(dt) {
    for (const f of this.floaties) { f.y += f.vy * dt; f.vy *= 0.94; f.t -= dt; }
    this.floaties = this.floaties.filter((f) => f.t > 0);
  }
  dust(tx, ty, color) { this.particles.burst(tx * TILE + 8, ty * TILE + 12, 6, { color, speed: 30, life: 0.4, size: 1.5, up: 6 }); }
  splash(tx, ty) { this.particles.burst(tx * TILE + 8, ty * TILE + 8, 8, { color: ['#7fb0e6', '#bfe0f0'], speed: 36, life: 0.4, size: 1.5, up: 8 }); }

  // Seasonal/night ambient motes — purely cosmetic.
  spawnAmbient(dt, area) {
    if (area.kind !== 'outdoor' && area.kind !== 'farm' && area.kind !== 'town') return;
    if (this.gs.time.isRaining()) return;
    this._amb = (this._amb || 0) + dt;
    const season = this.gs.time.season;
    const night = this.gs.time.isNight;
    const spawnAt = (x, y, o) => this.particles.spawn({ x, y, ...o });
    if (night && (season !== 3)) {
      // fireflies
      if (this.rng.bool(dt * 2.2)) {
        const x = this.r.cam.rx + this.rng.range(0, this.r.W), y = this.r.cam.ry + this.rng.range(40, this.r.H - 20);
        spawnAt(x, y, { vx: this.rng.range(-6, 6), vy: this.rng.range(-6, 6), life: 1.6, size: 1.6, color: '#ffe46b', grav: 0, drag: 1, shrink: false, shape: 'circle', fade: true });
      }
    } else if (season === 0) { // spring blossoms
      if (this.rng.bool(dt * 1.4)) {
        const x = this.r.cam.rx + this.rng.range(0, this.r.W), y = this.r.cam.ry - 4;
        spawnAt(x, y, { vx: this.rng.range(-12, 4), vy: this.rng.range(8, 18), life: 4, size: 1.6, color: this.rng.pick(['#f2c1d8', '#ffd8e8', '#fff']), grav: 0, drag: 1, shrink: false, shape: 'circle', spin: 2 });
      }
    } else if (season === 2) { // fall leaves
      if (this.rng.bool(dt * 1.2)) {
        const x = this.r.cam.rx + this.rng.range(0, this.r.W), y = this.r.cam.ry - 4;
        spawnAt(x, y, { vx: this.rng.range(-16, 2), vy: this.rng.range(10, 20), life: 4, size: 2, color: this.rng.pick(['#c8722e', '#d98b35', '#a85628']), grav: 0, drag: 1, shrink: false, shape: 'leaf', spin: 3 });
      }
    } else if (season === 1) { // summer pollen
      if (this.rng.bool(dt * 0.8)) {
        const x = this.r.cam.rx + this.rng.range(0, this.r.W), y = this.r.cam.ry + this.rng.range(0, this.r.H);
        spawnAt(x, y, { vx: this.rng.range(-4, 4), vy: this.rng.range(-4, 0), life: 3, size: 1, color: '#fff0a0', grav: 0, drag: 1, shrink: false, shape: 'circle' });
      }
    }
  }

  // Occasional ambient sound: birds by day, crickets/owls at night, waves at the beach.
  ambientAudio(dt, area) {
    this._ambT = (this._ambT == null ? this.rng.range(2, 5) : this._ambT) - dt;
    if (this._ambT > 0) return;
    const t = this.gs.time;
    if (area.id === 'beach') { this.audio.sfx('wave'); this._ambT = this.rng.range(3, 6); return; }
    if (area.kind === 'cave') { if (this.rng.bool(0.3)) this.audio.sfx('cricket'); this._ambT = this.rng.range(5, 10); return; }
    if (area.kind === 'outdoor' || area.kind === 'farm' || area.kind === 'town') {
      if (t.isRaining()) { this._ambT = this.rng.range(6, 10); return; }
      if (t.isNight) this.audio.sfx(this.rng.bool(0.25) ? 'owl' : 'cricket');
      else this.audio.sfx('bird');
      this._ambT = this.rng.range(4, 9);
    } else this._ambT = this.rng.range(5, 10);
  }

  spawnWeather(dt, area) {
    if (area.kind !== 'outdoor' && area.kind !== 'farm' && area.kind !== 'town') return;
    const w = this.gs.time.weather;
    if (w === 'rainy' || w === 'stormy') {
      this.weatherP += dt * (w === 'stormy' ? 80 : 45);
      while (this.weatherP >= 1) {
        this.weatherP -= 1;
        const x = this.r.cam.rx + this.rng.range(0, this.r.W);
        const y = this.r.cam.ry - 4;
        this.particles.spawn({ x, y, vx: -20, vy: 280, life: 0.5, size: 1, color: '#9cc0e8', grav: 0, drag: 1, shrink: false, shape: 'rect' });
      }
    } else if (w === 'snowy') {
      this.weatherP += dt * 18;
      while (this.weatherP >= 1) {
        this.weatherP -= 1;
        const x = this.r.cam.rx + this.rng.range(0, this.r.W);
        const y = this.r.cam.ry - 4;
        this.particles.spawn({ x, y, vx: this.rng.range(-10, 10), vy: 30, life: 3, size: 1.5, color: '#fff', grav: 0, drag: 1, shrink: false, shape: 'circle' });
      }
    }
  }

  // ---------------- rendering ----------------
  render() {
    const r = this.r;
    if (this.mode === 'title' || this.mode === 'charcreate') { this.title.render(); this.renderFade(); return; }
    this.renderWorld();
    HUD.render(this);
    if (this.fishing.state !== 'idle' && this.fishing.state !== 'done') HUD.renderFishing(this);
    if (this.mode === 'dialogue') this.dialogue.render();
    if (this.mode === 'shop') this.shop.render();
    if (this.mode === 'overlay') this.overlays.render();
    if (this.mode === 'sleep') this.renderSleep();
    if (this.mode === 'gameover') this.renderGameOver();
    if (this.flashT > 0) r.tint(this.flashColor, Math.min(0.4, this.flashT * 1.6));
    if (this.areaTitle && (this.mode === 'play' || this.mode === 'dialogue')) this.renderAreaTitle();
    this.renderFade();
  }

  renderAreaTitle() {
    const r = this.r, at = this.areaTitle;
    const a = Math.min(1, at.t, (2.6 - at.t) * 3);  // fade in then out
    if (a <= 0) return;
    r.ctx.globalAlpha = a;
    const w = r.textWidth(at.text, 14) + 40;
    const x = r.W / 2, y = 30;
    r.ctx.fillStyle = 'rgba(10,12,8,0.5)';
    r.ctx.fillRect(x - w / 2, y - 4, w, 22);
    r.ctx.fillStyle = '#aede6a'; r.ctx.fillRect(x - w / 2, y - 4, w, 1); r.ctx.fillRect(x - w / 2, y + 17, w, 1);
    r.text(at.text, x, y, { align: 'center', size: 14, color: '#fff6c0' });
    r.ctx.globalAlpha = 1;
  }

  renderWorld() {
    const r = this.r, gs = this.gs, area = gs.currentArea();
    const ctx = r.ctx;
    // bg color by area
    r.clear(area.kind === 'cave' ? '#15131a' : '#1a2410');

    const x0 = Math.max(0, Math.floor(r.cam.rx / TILE));
    const y0 = Math.max(0, Math.floor(r.cam.ry / TILE));
    const x1 = Math.min(area.w - 1, Math.floor((r.cam.rx + r.W) / TILE));
    const y1 = Math.min(area.h - 1, Math.floor((r.cam.ry + r.H) / TILE));
    const season = gs.time.season;
    const waterFrame = Math.floor((gs.time.minute * 2 + performance.now() / 250)) % 3;

    // ground
    const isWaterCode = (c) => c === T.water || c === T.water_deep;
    const foamPhase = (performance.now() / 600);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        let code = area.tileAt(tx, ty);
        let img;
        if (code === T.grass) img = Assets.tiles[['grass_spring', 'grass_summer', 'grass_fall', 'grass_winter'][season]];
        else if (code === T.water) img = Assets.water[waterFrame];
        else img = Assets.tiles[TILE_NAMES[code]];
        if (img) r.sprite(img, tx * TILE, ty * TILE);
        // animated shoreline foam where water meets land
        if (isWaterCode(code)) {
          const px = tx * TILE, py = ty * TILE;
          const fa = 0.35 + 0.25 * Math.sin(foamPhase + tx * 0.7 + ty * 0.5);
          ctx.globalAlpha = fa;
          ctx.fillStyle = '#cfeaff';
          if (!isWaterCode(area.tileAt(tx, ty - 1))) ctx.fillRect(r.sx(px), r.sy(py), TILE, 1);
          if (!isWaterCode(area.tileAt(tx, ty + 1))) ctx.fillRect(r.sx(px), r.sy(py + TILE - 1), TILE, 1);
          if (!isWaterCode(area.tileAt(tx - 1, ty))) ctx.fillRect(r.sx(px), r.sy(py), 1, TILE);
          if (!isWaterCode(area.tileAt(tx + 1, ty))) ctx.fillRect(r.sx(px + TILE - 1), r.sy(py), 1, TILE);
          ctx.globalAlpha = 1;
        }
      }
    }

    // farmland crops — drawn in the y-sort queue, with a gentle wind sway and a
    // sparkle on crops that are ready to harvest.
    const wind = Math.sin(performance.now() / 850);
    for (const plot of area.farmland.values()) {
      if (!plot.cropId) continue;
      const crop = CROP_BY_ID[plot.cropId];
      const stages = (plot.strainId && Assets.cropStages(Assets.strainStageKey(plot.strainId))) || Assets.cropStages(plot.cropId);
      if (!stages) continue;
      const idx = Farm.cropStageIndex(plot, crop);
      const img = stages[plot.dead ? 0 : idx];
      const grown = idx >= 2 && !plot.dead;
      const sway = grown ? Math.round(wind * Math.sin(plot.tx * 1.3 + plot.ty * 0.7) * 1.2) : 0;
      const wx = plot.tx * TILE + sway, wy = plot.ty * TILE - (img.height - TILE);
      const ready = Farm.isHarvestable(plot);
      r.push(plot.ty * TILE + TILE, (rr) => {
        if (plot.dead) { rr.ctx.globalAlpha = 0.55; rr.sprite(img, wx, wy); rr.ctx.globalAlpha = 1; }
        else { rr.sprite(img, wx, wy); }
        if (ready) this.drawSparkle(rr, plot.tx * TILE + 8, wy - 1);
      });
    }

    // objects -> y-sort queue
    for (const o of area.objects) {
      if (o.hidden) continue;
      this.queueObject(r, o, season);
    }
    // NPCs
    for (const npc of this.npcs) {
      const frames = Assets.npcs[npc.id];
      const img = npc.sprite(frames);
      const wx = npc.x, wy = npc.y;
      r.push(npc.feetY, (rr) => { rr.shadow(npc.cx, npc.feetY + 1, 12); rr.sprite(img, wx, wy); });
    }
    // enemies
    for (const e of this.enemies) {
      const img = Assets.enemies[e.type];
      const bobY = e.def.flying ? Math.sin(e.bob) * 3 - 6 : 0;
      r.push(e.cy, (rr) => {
        rr.shadow(e.cx, e.y + e.h + 1, 14);
        if (e.hurtT > 0) rr.ctx.globalAlpha = 0.6;
        rr.sprite(img, e.x - 1, e.y + bobY - 4, { flip: e.dir < 0 });
        rr.ctx.globalAlpha = 1;
        // hp bar
        if (e.hp < e.maxHp) { rr.rectScreen(rr.sx(e.x), rr.sy(e.y + bobY - 8), e.w, 2, '#000'); rr.rectScreen(rr.sx(e.x), rr.sy(e.y + bobY - 8), e.w * (e.hp / e.maxHp), 2, '#e85f5f'); }
      });
    }
    // player
    {
      const img = this.player.sprite(Assets);
      const wx = this.player.x, wy = this.player.y;
      const flash = this.player.flashT > 0 && Math.floor(this.player.flashT * 20) % 2 === 0;
      const idleBob = (!this.player.moving && !this.player.isSwinging()) ? Math.round(Math.sin(performance.now() / 480) * 0.5 - 0.5) : 0;
      r.push(this.player.feetY, (rr) => {
        rr.shadow(this.player.cx, this.player.feetY + 1, 13);
        if (flash) rr.ctx.globalAlpha = 0.4;
        rr.sprite(img, wx, wy + idleBob);
        rr.ctx.globalAlpha = 1;
        // tool highlight handled separately
      });
    }
    r.flush();

    // tool swing slash effect
    this.renderSwingFx();
    // tile target highlight when a tool/seed is selected
    this.renderTileTarget(area);

    // floaties (item pickups)
    for (const f of this.floaties) {
      const a = Math.min(1, f.t * 1.6);
      ctx.globalAlpha = a;
      if (f.kind === 'item') {
        const icon = Assets.icon(f.icon);
        if (icon) r.sprite(icon, f.x - 8, f.y - 8);
        if (f.count > 1) r.text('x' + f.count, r.sx(f.x) + 9, r.sy(f.y) - 4, { size: 8, color: '#fff' });
      } else {
        r.text(f.text, r.sx(f.x), r.sy(f.y), { align: 'center', size: 8, color: f.color || '#fff' });
      }
      ctx.globalAlpha = 1;
    }

    // particles (rain drawn here, above world)
    this.particles.draw(r);

    // lighting / day-night
    this.renderLighting(area);
  }

  queueObject(r, o, season) {
    const seasonName = ['spring', 'summer', 'fall', 'winter'][season];
    let img, wx = o.tx * TILE, wy = o.ty * TILE, sortY = (o.ty + 1) * TILE, oy = 0, ox = 0, shadowW = 16;
    switch (o.type) {
      case 'tree': img = Assets.trees[seasonName]; ox = -8; oy = -(44 - TILE); shadowW = 22; break;
      case 'tree2': img = Assets.trees2[seasonName]; ox = -8; oy = -(44 - TILE); shadowW = 22; break;
      case 'stump': img = Assets.stump; ox = -2; oy = -(18 - TILE); break;
      case 'bush': img = o.berry ? Assets.bushes.berry : Assets.bushes.plain; ox = -3; oy = -(20 - TILE); break;
      case 'rock': img = Assets.rocks[o.size || 'med']; oy = -(img.height - TILE); ox = (TILE - img.width) / 2; break;
      case 'log': img = Assets.rocks.med; break;
      case 'weed': img = Assets.weeds[o.v || 0]; ox = 1; oy = -(14 - TILE) + 2; break;
      case 'forage': img = Assets.forage[o.fk] || Assets.forage.berry; ox = 1; oy = 2; break;
      case 'building': {
        img = Assets.buildings[o.sprite];
        const drawW = o.drawW || img.width, drawH = o.drawH || img.height;
        const bx = o.tx * TILE + (o.fw * TILE - drawW) / 2;
        const by = (o.ty + o.fh) * TILE - drawH + (o.oy ? 0 : 0);
        r.push((o.ty + o.fh) * TILE, (rr) => rr.sprite(img, bx, by));
        return;
      }
      case 'sign': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 5), rr.sy(wy + 4), 6, 8, '#8a5a2e'); rr.rectScreen(rr.sx(wx + 4), rr.sy(wy + 2), 8, 5, '#caa15e'); }); return;
      case 'chest': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 4), 12, 9, '#8a5a2e'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 4), 12, 3, '#a87038'); rr.rectScreen(rr.sx(wx + 7), rr.sy(wy + 8), 2, 2, '#ffcf3f'); }); return;
      case 'bin': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 1), rr.sy(wy + 2), 14, 12, '#7a5a3a'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 1), 12, 4, '#5a4028'); }); return;
      case 'bench': r.push(sortY, (rr) => {
        // a botanist's breeding bench: wood table with potted seedlings + flasks
        rr.rectScreen(rr.sx(wx), rr.sy(wy + 6), 16, 8, '#8a6a3a'); rr.rectScreen(rr.sx(wx), rr.sy(wy + 5), 16, 2, '#a8854a');
        rr.rectScreen(rr.sx(wx + 1), rr.sy(wy + 13), 2, 3, '#6e4f28'); rr.rectScreen(rr.sx(wx + 13), rr.sy(wy + 13), 2, 3, '#6e4f28');
        rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 2), 3, 4, '#caa15e'); rr.rectScreen(rr.sx(wx + 3), rr.sy(wy), 1, 3, '#6cae44');
        rr.rectScreen(rr.sx(wx + 7), rr.sy(wy + 1), 3, 5, '#9cd0e8'); rr.rectScreen(rr.sx(wx + 8), rr.sy(wy + 2), 1, 3, '#e85f9a');
        rr.rectScreen(rr.sx(wx + 11), rr.sy(wy + 2), 3, 4, '#caa15e'); rr.rectScreen(rr.sx(wx + 12), rr.sy(wy), 1, 3, '#e8d24e');
      }); return;
      case 'ladder': r.push(sortY - 30, (rr) => { for (let i = 0; i < 4; i++) rr.rectScreen(rr.sx(wx + 3), rr.sy(wy + 2 + i * 3), 10, 1, '#caa15e'); rr.rectScreen(rr.sx(wx + 3), rr.sy(wy + 1), 1, 14, '#8a6a3a'); rr.rectScreen(rr.sx(wx + 12), rr.sy(wy + 1), 1, 14, '#8a6a3a'); rr.text('▼', rr.sx(wx + 8), rr.sy(wy - 6), { align: 'center', size: 7, color: '#aede6a' }); }); return;
      case 'ladder_up': r.push(sortY - 30, (rr) => { for (let i = 0; i < 4; i++) rr.rectScreen(rr.sx(wx + 3), rr.sy(wy + 2 + i * 3), 10, 1, '#caa15e'); rr.text('▲', rr.sx(wx + 8), rr.sy(wy - 6), { align: 'center', size: 7, color: '#aede6a' }); }); return;
      case 'sprinkler': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 5), rr.sy(wy + 6), 6, 5, '#8aa0c0'); rr.rectScreen(rr.sx(wx + 6), rr.sy(wy + 4), 4, 3, '#aab8d0'); }); return;
      case 'scarecrow': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 7), rr.sy(wy - 6), 2, 16, '#8a5a2e'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy - 2), 12, 2, '#8a5a2e'); rr.circle && rr.rectScreen(rr.sx(wx + 5), rr.sy(wy - 10), 6, 6, '#caa15e'); }); return;
      case 'torch': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 7), rr.sy(wy + 2), 2, 10, '#8a5a2e'); rr.rectScreen(rr.sx(wx + 6), rr.sy(wy - 2), 4, 4, '#ffae3f'); }); return;
      case 'fence': r.push(sortY, (rr) => { rr.rectScreen(rr.sx(wx + 3), rr.sy(wy + 2), 2, 12, '#9c7142'); rr.rectScreen(rr.sx(wx + 11), rr.sy(wy + 2), 2, 12, '#9c7142'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 5), 12, 2, '#9c7142'); }); return;
      case 'bed': r.push((o.ty + o.fh) * TILE, (rr) => { rr.rectScreen(rr.sx(wx), rr.sy(wy + 2), o.fw * TILE, o.fh * TILE - 2, '#9c4a5a'); rr.rectScreen(rr.sx(wx), rr.sy(wy + 2), o.fw * TILE, 5, '#e8e0d0'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 3), 8, 3, '#fff'); }); return;
      case 'kitchen': r.push((o.ty + o.fh) * TILE, (rr) => { rr.rectScreen(rr.sx(wx), rr.sy(wy + 2), o.fw * TILE, o.fh * TILE - 2, '#8a8e96'); rr.rectScreen(rr.sx(wx + 2), rr.sy(wy + 4), 4, 4, '#2c2c33'); rr.rectScreen(rr.sx(wx + 9), rr.sy(wy + 4), 4, 3, '#5fa0e0'); }); return;
      case 'wall': return;
      default: return;
    }
    if (img) {
      let wob = 0;
      if (o.hitAt) { const e = (performance.now() - o.hitAt) / 1000; if (e < 0.3) wob = Math.sin(e * 46) * (1 - e / 0.3) * 2; }
      const fx = wx + ox + wob, fy = wy + oy;
      r.push(sortY, (rr) => {
        if (o.type !== 'weed' && o.type !== 'forage') rr.shadow(o.tx * TILE + 8, (o.ty + 1) * TILE - 1, shadowW, 0.22);
        rr.sprite(img, fx, fy);
      });
    }
  }

  // Pulsing 4-point sparkle to flag a ready-to-harvest crop (drawn in screen space).
  drawSparkle(rr, wx, wy) {
    const ctx = rr.ctx;
    const tt = performance.now() / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(tt * 4 + wx * 0.05);
    const sx = rr.sx(wx), sy = rr.sy(wy) - 4 - pulse * 2;
    const s = 1.6 + pulse * 1.4;
    ctx.save();
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillStyle = '#fff6c0';
    ctx.fillRect(sx - s, sy, s * 2, 1);
    ctx.fillRect(sx, sy - s, 1, s * 2);
    ctx.fillStyle = '#ffe46b';
    ctx.fillRect(sx, sy, 1, 1);
    ctx.restore();
  }

  renderSwingFx() {
    const p = this.player;
    if (!p.isSwinging() || !p.swingFx) return;
    const prog = 1 - (p.swingT / (p.swingDur || 0.34));
    const base = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[p.faceDir] || 0;
    const cx = this.r.sx(p.cx), cy = this.r.sy(p.feetY - 9);
    const ctx = this.r.ctx;
    const a = base - 1.0 + prog * 2.0;
    ctx.save();
    ctx.globalAlpha = 0.7 * (1 - prog);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 15, a - 0.5, a + 0.5); ctx.stroke();
    ctx.globalAlpha = 0.4 * (1 - prog);
    ctx.lineWidth = 1; ctx.strokeStyle = '#cfeaff';
    ctx.beginPath(); ctx.arc(cx, cy, 18, a - 0.4, a + 0.4); ctx.stroke();
    ctx.restore();
  }

  renderTileTarget(area) {
    if (this.mode !== 'play') return;
    if (this.fishing.state !== 'idle' && this.fishing.state !== 'done') return;
    const r = this.r, ctx = r.ctx;
    const sel = this.selectedItem();
    const selDef = sel ? ITEMS[sel.id] : null;

    // If holding seeds/placeables, show the faced tile outline for placement.
    if (selDef && (selDef.type === 'seed' || selDef.placeable)) {
      const { tx, ty } = this.player.facingTile();
      const can = selDef.type === 'seed' ? !!area.plotAt(tx, ty) && !area.plotAt(tx, ty).cropId
        : !area.objectAt(tx, ty) && !area.isWater(tx, ty);
      ctx.globalAlpha = 0.6;
      r.strokeRectScreen(r.sx(tx * TILE), r.sy(ty * TILE), TILE, TILE, can ? '#aede6a' : '#e85f5f', 1);
      ctx.globalAlpha = 1;
      return;
    }

    const t = this.getFacedTarget();
    if (!t) return;
    // soft targets (till empty grass / water empty soil) only when intent matches
    if (t.soft && !(selDef && selDef.type === 'tool' && selDef.tool === t.tool)) return;

    const ready = !t.tool || this.gs.inv.has(t.tool);
    const col = ready ? '#aede6a' : '#e8b35f';

    // highlight the target tile
    if (t.tx != null) {
      const pulse = 0.4 + 0.2 * Math.sin(performance.now() / 180);
      ctx.globalAlpha = pulse;
      r.strokeRectScreen(r.sx(t.tx * TILE), r.sy(t.ty * TILE), TILE, TILE, col, 1);
      ctx.globalAlpha = 1;
    }
    // prompt chip above the target
    this.renderPromptChip(t, ready, col);
  }

  renderPromptChip(t, ready, col) {
    const r = this.r, ctx = r.ctx;
    const keyLabel = t.key === 'e' ? 'E' : 'SPC';
    const hasIcon = !!t.tool;
    const label = t.action + (t.tool && !ready ? '!' : '');
    const tw = r.textWidth(label, 8);
    const chipW = 6 + (hasIcon ? 16 : 0) + tw + 6 + 16 + 6;
    const sx = Math.round(r.sx(t.x) - chipW / 2);
    const sy = Math.round(r.sy(t.y) - 16);
    // bg
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#1a130c';
    ctx.fillRect(sx, sy, chipW, 14);
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, chipW - 1, 13);
    ctx.globalAlpha = 1;
    let x = sx + 5;
    if (hasIcon) { const icon = Assets.icon(t.tool); if (icon) r.spriteScreen(icon, x - 1, sy - 1, { w: 14, h: 14 }); x += 16; }
    r.text(label, x, sy + 3, { size: 8, color: ready ? '#fff' : col });
    x += tw + 5;
    // key chip
    ctx.fillStyle = ready ? '#3a5a2e' : '#5a4326';
    ctx.fillRect(x, sy + 2, 16, 10);
    ctx.strokeStyle = col; ctx.strokeRect(x + 0.5, sy + 2.5, 15, 9);
    r.text(keyLabel, x + 8, sy + 4, { align: 'center', size: 7, color: '#fff', shadow: null });
  }

  renderLighting(area) {
    const t = this.gs.time, min = t.minute, R = this.r;
    const tri = (x, a, p, b) => x < a || x > b ? 0 : (x < p ? (x - a) / (p - a) : 1 - (x - p) / (b - p));
    const px = this.player.cx, py = this.player.feetY - 7;
    const torches = area.objects.filter((o) => o.type === 'torch');

    if (area.kind === 'cave') {
      // 1) deep darkness, with soft holes for the lantern + torches (partial, so
      //    the lit area still reads as a warm cohesive pool, not a hard spotlight).
      const holes = [{ x: px, y: py, r: 60, i: 0.88 }];
      for (const o of torches) holes.push({ x: o.tx * TILE + 8, y: o.ty * TILE + 4, r: 46, i: 0.9 });
      R.lightPass('#0a0712', 0.95, holes);
      // 2) warm additive light pools over the revealed (dark) cave floor — this is
      //    what makes it feel torch-lit rather than foggy grey.
      const warm = [{ x: px, y: py, r: 54, color: '#ffb45e', i: 0.34 }, { x: px, y: py, r: 26, color: '#ffe6b0', i: 0.22 }];
      for (const o of torches) { warm.push({ x: o.tx * TILE + 8, y: o.ty * TILE + 2, r: 44, color: '#ff9a3a', i: 0.5 }); }
      R.bloom(warm);
      R.vignette(0.55, '#040208');
      return;
    }

    const light = t.daylight(), dark = 1 - light;
    if (dark > 0.04) {
      // Multiply-darken the whole scene toward a cool moonlit blue — this also
      // desaturates the bright daytime greens so night genuinely reads as night.
      const night = dark > 0.55;
      // lerp the multiply colour from a soft dusk-blue to a deep night-blue
      const mulCol = t.isRaining() ? '#2a3a5c' : (night ? '#1b2750' : '#4a577e');
      R.grade(mulCol, Math.min(0.95, dark * 1.05), 'multiply');
      // Re-light pools additively: a soft warm lantern around the player + torches.
      const warm = [];
      if (night) warm.push({ x: px, y: py, r: 46, color: '#ffca80', i: 0.30 }, { x: px, y: py, r: 22, color: '#ffe4b4', i: 0.16 });
      for (const o of torches) { warm.push({ x: o.tx * TILE + 8, y: o.ty * TILE, r: 40, color: '#ffa544', i: 0.55 }, { x: o.tx * TILE + 8, y: o.ty * TILE, r: 16, color: '#ffe6b0', i: 0.3 }); }
      // a faint cool moonlight fill so the immediate area stays readable
      if (night) warm.push({ x: px, y: py, r: 80, color: '#4a64a0', i: 0.10 });
      if (warm.length) R.bloom(warm);
    }
    // time-of-day colour grade
    const dawnA = 0.22 * tri(min, 5 * 60, 6.4 * 60, 8.2 * 60);
    if (dawnA > 0.002) R.grade('#ffb877', dawnA, 'overlay');
    const duskA = 0.26 * tri(min, 16.2 * 60, 18.3 * 60, 20.2 * 60);
    if (duskA > 0.002) R.grade('#ff7e44', duskA, 'overlay');
    if (light > 0.92 && !t.isRaining()) R.grade('#fff4d8', 0.05, 'overlay');
    if (t.weather === 'cloudy' && dark < 0.4) R.tint('#5a6a7a', 0.10);
    if (t.weather === 'stormy') R.tint('#28324f', 0.15);
    if (t.weather === 'snowy') R.grade('#cfe6ff', 0.12, 'overlay');
    R.vignette(0.16 + dark * 0.20, t.isRaining() ? '#0a1428' : '#0a0a16');
  }

  renderSleep() {
    const r = this.r, ctx = r.ctx;
    r.tint('#000', Math.min(0.85, (this.sleepT || 0) * 1.5));
    const s = this.daySummary;
    if (!s || (this.sleepT || 0) < 0.5) return;
    const w = 200, h = 120, x = (r.W - w) / 2, y = (r.H - h) / 2;
    HUD.daySummaryPanel(this, x, y, w, h, s);
  }

  renderGameOver() {
    const r = this.r;
    r.tint('#000', 0.8);
    r.text(this.faintReason === 'fainted' ? 'You fainted…' : 'You passed out…', r.W / 2, r.H / 2 - 24, { align: 'center', size: 16, color: '#e85f5f' });
    r.text(`A neighbor found you and carried you home.`, r.W / 2, r.H / 2, { align: 'center', size: 8, color: '#ccc' });
    if (this.faintLost > 0) r.text(`Lost ${this.faintLost}g in the confusion.`, r.W / 2, r.H / 2 + 14, { align: 'center', size: 8, color: '#e8b35f' });
    r.text('Press Enter to wake up', r.W / 2, r.H / 2 + 36, { align: 'center', size: 8, color: '#aede6a' });
  }

  renderFade() {
    if (this.fade.a > 0) this.r.tint('#000', this.fade.a);
  }
}

// helper to find NPC's area without importing NPC class internals into loaders
import { NPC_AREA } from './entities/npc.js';
function NPC_AREA_OF(id) { return (NPC_AREA[id] || { area: 'town' }).area; }
