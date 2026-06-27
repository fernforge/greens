# 🌱 Greens

A complete, production-grade **2.5D top-down farming RPG** built from scratch in
vanilla JavaScript + HTML5 Canvas — **no external art or audio assets**. Every
sprite is generated procedurally in code; every sound is synthesized with the
Web Audio API.

## Play

```bash
npm start
# open http://localhost:5173 in your browser
```

No build step. The game runs as native ES modules served by a tiny zero-dependency
Node static server (`server.js`).

## Controls

| Action | Keys |
|---|---|
| Move | WASD / Arrow keys |
| Run | Shift |
| Use / Act | Space (or click) — **Smart Tool** auto-picks the right tool for what you face |
| Interact / talk / harvest / gather | E or F |
| Inventory | I or Tab |
| Journal (Quests / Folk / Almanac / Awards / Stats) | J |
| Map | M |
| Pause menu & Help | Esc |
| Hotbar slots | 1–0, Q/R, or mouse wheel |

**New players:** a floating prompt above whatever you face shows the action and the
tool it needs, colour-coded. **Smart Tool** (on by default, toggle in the pause menu)
means you can just press **Space** — it equips and swings the correct tool automatically.
A short guided tutorial walks you through the first day. Press **Esc → Help** anytime.

## Features

- **Farming** — 39 crops across 4 seasons. Till, plant, water, and harvest.
  Crops grow over days, some regrow, quality tiers (normal/silver/gold), fertilizer,
  sprinklers, and a shipping bin that sells overnight.
- **Time & weather** — a living day/night cycle, 28-day seasons, 4 seasons/year,
  and weather (sun, rain, clouds, storms, snow) that affects crops and fishing.
- **Skills & progression** — Farming, Foraging, Mining, Combat, Fishing, Cooking,
  each leveling 0–10 with perks (more energy/health, tool upgrades).
- **Town & relationships** — 8 villagers with personalities, tiered dialogue,
  gift preferences, birthdays, and a 10-heart friendship system.
- **Exploration** — farm, home interior, town, forest (river), beach (ocean pier),
  and a procedurally generated, ever-deepening **mine**.
- **Combat** — 7 enemy types in the mine with loot, ore, gems, and treasure chests.
- **Fishing** — 16 fish with a real-time reeling minigame.
- **Cooking & crafting** — 26 recipes (kitchen dishes + workbench items).
- **Quests** — 18 quests including a full main story arc: restoring the lost
  **Ancient Green**.
- **Saving** — 3 save slots, autosave on sleep, all via localStorage.
- **Onboarding & accessibility (low floor)** — contextual action prompts, Smart Tool,
  a guided tutorial with an objective banner, an on-screen quest tracker, and a Help screen.
- **Achievements & Almanac (high ceiling)** — 17 achievements with unlock fanfare and a
  collection log tracking every crop, fish, forageable, mineral, and dish you've discovered.
- **Polish** — time-of-day colour grading (warm dawn/golden dusk), additive bloom on light
  sources, cinematic vignette, animated shoreline foam, tool-swing arcs, hit-stop on impact,
  floating damage numbers, screen flashes on level-up/quests, particles, screen shake,
  dynamic lighting, weather effects, day-summary screen, character creation, and an
  animated parallax title.

## Architecture

```
server.js            zero-dep static server
index.html           boot + loading screen
src/
  main.js            wiring + loop
  engine/            reusable: math, rng, input, loop, renderer (camera/y-sort/
                     lighting), pixel API, spritegen, audio, particles, save
  game/
    state.js         central GameState (single source of truth, save/load)
    game.js          orchestrator: update/render, tools, interaction, day cycle
    assets.js        procedural sprite/icon cache
    data/            content tables (crops, items, fish, enemies, recipes, npcs, quests)
    world/           tiles, Area model, map generation
    systems/         inventory, time, skills, farming, fishing, questlog
    entities/        player, npc, enemy
    ui/              widgets, hud, title, dialogue, shop, overlays
```

## Build & publish

```bash
npm run dist     # → dist/greens-web.zip (98 KB, index.html at root) — upload to itch.io
```

It's a pure static build (no bundler/server needed), so it also drops straight onto
Netlify, GitHub Pages, Cloudflare Pages, or Vercel. See **[DEPLOY.md](DEPLOY.md)** for the
full publishing + monetization plan.

## Tests

```bash
node test/smoke.mjs      # headless logic smoke test (stubbed canvas)
node test/render.mjs     # renders real frames to test/shots/*.png (uses @napi-rs/canvas)
node test/nightshots.mjs # renders night + cave lighting for QA
```

The game itself needs **no** dependencies; `puppeteer`/`@napi-rs/canvas` are dev-only
tools used to verify rendering offline.
