# PROGRESS.md archive — snapshot 2026-06-27

Historical ROUND/RUN sections moved verbatim from PROGRESS.md during cleanup.

# Greens — Project Progress

## Goal
A complete, production-grade, RPG/farming progression **2.5D top-down** game called **Greens**.
Lots of content, game saving, polish. Browser-based (HTML5 Canvas + vanilla ES modules).
Runs with zero build step via a tiny Node static server; also Vite-buildable.

## Tech decisions (and WHY)
- **Vanilla JS ES modules + Canvas2D**: maximum robustness, no build fragility, runs anywhere.
  A tiny `server.js` (Node http) serves files with correct MIME types. `npm start` runs it.
- **All art generated procedurally** at runtime (pixel-art sprite generator) — no external asset
  fetching, fully self-contained, deterministic via seeded RNG.
- **Audio generated procedurally** via Web Audio API (SFX + chiptune music) — no asset files.
- **Save** via localStorage (JSON), multiple slots, autosave on sleep.
- **2.5D look**: top-down tiles with y-sorted billboard sprites that have visible height +
  drop shadows + subtle vertical offset for depth (Stardew-style).

## Architecture
- `src/engine/` — reusable engine: game loop, input, canvas, RNG, sprite gen, audio, particles,
  tween, scene manager, save manager.
- `src/game/` — game-specific: World/scenes, Player, farming, time/season, inventory, shop,
  NPCs/dialogue/quests, combat/mine, skills, UI/HUD.
- `src/game/data/` — content data tables (crops, items, npcs, dialogue, recipes, enemies, quests).

## ════════ ROUND 5 — Phase 0 GENETICS prototype + find testers ════════
BUILT the differentiator (crop breeding) — DONE & verified:
- systems/genetics.js: genes (hue/yield/speed/value/hardiness), cross() w/ mutation, create(),
  register() (adds st_seed_<id> / st_crop_<id> items + hue-tinted sprites via Assets.tintCanvas),
  encode/decode SEED CODES (GRN1-... shareable strings), importCode, nameFor, previewCross.
- assets.js: tintCanvas (HSL hue-rotate) + buildStrainSprites; state.js persists gs.strains/strainSeq;
  farming.js plot.strainId+growDays (speed gene); game.js plant/harvest strain produce, breeding
  bench object (farm tile 12,7), renders tinted strain crops; overlays.js Breeding UI (parent slots,
  live offspring preview w/ gene bars, Breed/Copy Code/Import Code, seed grid); Almanac "Strains" tab;
  3 breeding achievements. mapgen: bench + sign on farm.
- Verified: smoke +5 genetics checks ALL PASSED; test/genetshots.mjs proves strains render as
  visibly DIFFERENT COLOURS in a row (purple/red/teal/blue lettuce) + breeding UI + almanac.
- Build: npm run dist → 105 KB. ~6,976 LOC.
NEXT (this round): post to an agent network for testers (NOT Moltbook — user excluded it),
then report back waiting for testers. Researching options now.

## ════════ ROUND 4 — differentiation strategy (report) ════════
User: "game is good but it's a generic Stardew-like with no differentiator — brainstorm a
solution + paths, write a report." → Delivered **DIFFERENTIATION.md**.
RECOMMENDED DIRECTION (for future build sessions):
- Signature hook = **crop GENETICS / plant breeding** (genes: yield/speed/color/hardiness;
  cross-breed → mutated offspring; strains serialize to shareable **seed-code strings**; ties
  to the "Greens"/Ancient-Green identity). On-theme, defensible, ~M effort, HIGH code fit
  (rides on data/crops.js + systems/farming.js + Almanac). Procedural sprites tint by gene = free visuals.
- Structure = optional **roguelike "Run" mode** (season=run, draft seeds/perks, score, meta-unlocks)
  for replay + short web/mobile sessions. Add as a mode beside free-play.
- GTM edge = **98 KB instant-play web** (portals/virality) — do regardless.
- Pitch: "a roguelike farming game where you breed legendary plant strains & trade them."
- Phase 0 (cheap validation): minimal gene fields + breeding bench + visible color gene; ship to
  ~20 testers. If the "I made a new plant!" moment lands, commit; else pivot to Run mode.
NOTE: this round was report-only; game code unchanged & still green (smoke ALL PASSED).

## ════════ ROUND 3 — lighting fix + more polish + deploy plan ════════
User: "night/cave lighting looks weird — screenshot & fix. Polish more. Brainstorm deploy + profit."

LIGHTING FIX (done & verified via test/nightshots.mjs):
- Root cause: night used a destination-out light hole over bright daytime ground = harsh
  white spotlight; cave revealed dark grey floor = foggy. Also source-over blue tint couldn't
  desaturate bright grass.
- New approach: OUTDOOR NIGHT = multiply-darken whole scene (cool night-blue, desaturates
  greens; corners verified ~RGB 38,41,35) + ADDITIVE warm lantern/torch bloom pools.
  CAVE = deep darkness + soft light holes + warm amber additive pools (cozy, not grey).
  Softer multi-stop falloff in renderer.lightPass. Dawn/dusk overlay grades + vignette kept.
- Verified: napi-canvas supports multiply/overlay; pixel sampling confirms dark night + soft
  warm pools. Screenshots look good (n*/c* in test/shots).

MORE POLISH (done): ready-to-harvest sparkle, crop wind-sway, object hit-wobble on chop/mine,
player idle breathing bob, ambient audio (birds/crickets/owl/waves by area+time), area-title
card on warp. test/nightshots.mjs added for lighting QA.

DEPLOY/PROFIT: breakdown delivered to user at end of run (itch.io fastest; web-export ready
since it's static files — no build needed).

## ════════ AAA UPGRADE (round 2) ════════
User feedback: "make it AAA-tier, low-floor/high-ceiling, production-ready. It was
confusing which tool to use to collect what — a tutorial/tooltip/warning would help."

### Plan (executing in phases; verify after each)
**Phase 1 — Guidance & onboarding (the feedback) [PRIORITY]**
- getFacedTarget(): detect what the player faces + which tool/action it needs.
- Context action prompt: floating chip above target showing action + tool icon + key,
  color-coded (green=ready, amber=need/equip tool). Replaces bare tile outline.
- Smart Tool (setting, default ON): Space auto-uses the correct tool for the faced
  target (auto-swaps), so "which tool?" is a non-issue. Off = manual for pros.
- Wrong-tool toasts telling you which slot has the right tool.
- Forage pickable with E (not just scythe). Lower floor.
- Guided Tutorial system: HUD objective banner, step sequence w/ checks, skippable.
- Help/Controls overlay (pause + title + key).

**Phase 2 — Visual & game-feel polish (the "hype")**
- Renderer: time-of-day color grading (dawn/day/dusk/night), additive bloom for
  light sources, vignette, water shimmer/foam.
- Camera look-ahead in facing dir; tuned smoothing.
- Juice: hit-stop on impacts, floating damage numbers, harvest/hit pop scale,
  tool swing arc, screen flash on level-up/quest, overlay fade-in.
- Title screen: parallax hills, particles, animated farmer, sun arc.

**Phase 3 — Content depth (high ceiling)**
- Achievements system + unlock toasts.
- Almanac/Collection log (crops/fish/minerals/cooking/monsters) — journal tabs.

**Phase 4 — verify (smoke + render shots), balance, finalize.**

Status: ✅ AAA UPGRADE COMPLETE & VERIFIED. Smoke = 24 checks ALL PASSED (stable x3),
all src files pass node --check, render shots confirm visuals.

- Phase 1 (guidance/feedback) ✅: getFacedTarget + context prompt chip (tool icon+action+key,
  color-coded), Smart Tool (default ON, auto-equips correct tool; toggle in pause), wrong-tool
  hints w/ slot, forage via E, Tutorial system + HUD objective banner, quest tracker on HUD,
  Help/Controls overlay (pause+title).
- Phase 2 (visual/feel) ✅: renderer time-of-day color grade (warm dawn/golden dusk/midday/snow),
  additive bloom for torches/lantern, cinematic vignette, animated shoreline foam, tool-swing
  arcs, hit-stop on combat impacts, floating damage numbers, screen flash on level-up/quest/hurt,
  camera look-ahead, parallax title w/ petals+crop rows+sun glow.
- Phase 3 (depth) ✅: Achievements (17) w/ unlock fanfare + screen flash; Almanac/Collections
  (crops/fish/forage/minerals/dishes) + Achievements tabs in Journal; discovery tracking in stats.

New modules: systems/tutorial.js, systems/achievements.js. Renderer gained bloom/vignette/grade.
Old saves: tutorial stays inactive (no tutorialStep), achievements default []. Settings.smartTool
defaults true.

## Status (round 1): ✅ COMPLETE — full game shipped, verified, polished (~5,900 LOC, 38 modules).

Final smoke test (`npm test`) covers: new game, farming cycle, all overlays, shop,
sleep/day-cycle, save→load roundtrip, warps, mine, **fishing, combat+loot, gifting,
cooking, eating, chest** — ALL PASSED. All source files pass `node --check`.
Seasonal ambient particles (blossoms/leaves/fireflies/pollen) added. Server serves all routes (200).

### VERIFIED WORKING (2026-06-16)
- `node test/smoke.mjs` → ALL PASSED (stable across 3 runs). Exercises new game,
  farming cycle, all overlays, shop, sleep/day-cycle, save→serialize→load, warps, mine.
- `node test/render.mjs` → renders real frames via @napi-rs/canvas to test/shots/*.png.
  Visually confirmed: title, farm, growing crops, dusk lighting, inventory, town+NPCs,
  dialogue box, mine darkness+player light, shop. All sprites/tiles/UI correct.
- KNOWN NON-ISSUE: text doesn't appear in test/shots/*.png because this container has
  no font library for @napi-rs/canvas. Standard `ctx.fillText` works in ALL browsers.
  Headless Chrome (puppeteer) can't run here — missing libglib (no root). Not a game bug.

### Bugs fixed during verification
- palette undefined crash → startNewGame uses gs.player.palette
- warp tiles instantly bouncing player → added `warpLock` (must step off warp first)
- farm had no shipping bin → added 'bin' object + sign in genFarm; home entry moved off door

### How to verify rendering offline (no browser needed)
`npm run shots` then Read the PNGs in test/shots/.

### Remaining (optional polish/expansion)
- More content (extra quests/dialogue/items) — core already extensive
- Animals/barn (not implemented; ranching is referenced in lore only)
- Greenhouse for winter farming (winter crops exist but no greenhouse building)

### Done
- Engine: math, rng, input, loop, renderer (camera/y-sort/lighting), pixel API,
  spritegen (chars/crops/tiles/trees/rocks/items/enemies/buildings), audio (SFX+chiptune),
  particles, save manager.
- Data: 35 crops, full item registry, 16 fish, 7 enemies, 26 recipes, 8 NPCs w/ dialogue+gifts,
  18 quests incl. main story arc (Ancient Green).
- Assets builder (procedural icon/sprite cache).
- World: tile registry, Area model (collision/farmland/warps), mapgen (farm, home interior,
  town, forest, beach, mine entrance + procedural mine levels).
- Systems: Inventory, TimeSystem (day/night/season/weather), Skills, GameState (save/load serialize).

### Next (in order)
- Player entity (movement/anim/tool-use)  ← IN PROGRESS
- Farming system (growth on sleep), tool actions, combat, fishing minigame
- Game orchestrator (game.js): scenes, update/render, lighting, weather fx
- UI: HUD, hotbar, inventory, dialogue, shop, crafting/cooking, journal, map, menus, title
- main.js boot + loading screen wiring
- Test in headless browser, balance, polish

### TODO (build order)
1. [ ] server.js + package.json + index.html boot
2. [ ] Engine core: loop, input, canvas/renderer, RNG, math
3. [ ] Procedural sprite + tile generator
4. [ ] Procedural audio (SFX + music)
5. [ ] Tilemap world + camera + collision + y-sort renderer
6. [ ] Player entity + animation + stats (energy/health)
7. [ ] Time system: clock, day/night, seasons, calendar, weather
8. [ ] Farming: till/plant/water/grow/harvest, soil tiles, crop data
9. [ ] Inventory + items + tools + hotbar
10. [ ] Economy + shop UI + sell box
11. [ ] NPCs + dialogue + relationships + gifts + quests
12. [ ] Skills/leveling (farming, foraging, mining, combat, fishing)
13. [ ] Mine/dungeon + combat + enemies + loot
14. [ ] Fishing minigame
15. [ ] Cooking/crafting recipes
16. [ ] Save/load (slots, autosave) + title/menu screens
17. [ ] Polish: particles, weather fx, screen transitions, lighting, footstep dust, SFX hooks
18. [ ] Balancing pass + content expansion + bugfix

## How to run
```
cd /home/node/workspace
npm start        # serves on http://localhost:5173
```
Open the URL in a browser. (Headless test: `node server.js` then curl the page.)

## Gotchas
- Date.now()/Math.random() are fine in the GAME (browser), just not in workflow scripts.
- Keep all module imports with explicit `.js` extensions so native ESM + Vite both work.
