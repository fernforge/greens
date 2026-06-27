# Greens — Project Progress

## Goal
A complete, production-grade, RPG/farming progression **2.5D top-down** game ("Greens").
Lots of content, game saving, polish. Browser-based (HTML5 Canvas + vanilla ES modules),
zero build step. Signature differentiator: **crop genetics / plant breeding** (shareable seed codes).
**Current task: publish to GitHub + GitHub Pages — ✅ DONE.**

## Current state
- ✅ PUBLISHED: repo https://github.com/fernforge/greens — LIVE at https://fernforge.github.io/greens/
  Verified live via Playwright: canvas mounts, no console errors, title screen renders.
- Game is COMPLETE and verified: `node test/smoke.mjs` → ALL PASSED (29 checks). ~6,976 LOC.
- All art/audio procedurally generated at runtime; save via localStorage.
- Static site: `index.html` + `src/` is the whole runtime (no bundler needed for hosting).
- `npm run dist` builds `dist/greens-web.zip` (~105 KB) for itch.io/Netlify.
- Engine, world, farming, time/season/weather, NPCs/quests, combat/mine, fishing, cooking,
  skills, achievements, almanac, tutorial, and crop-breeding genetics all done & tested.
- Docs present: README.md, DEPLOY.md, DIFFERENTIATION.md, PLAYTEST.md.

## What's left
Nothing for the publish task — all complete:
- [x] git init + initial commit (59 files), branch `main`.
- [x] Created GitHub repo `fernforge/greens` via API, pushed.
- [x] Enabled GitHub Pages (root of `main`); `.nojekyll` added.
- [x] Verified Pages URL loads (HTTP 200) and game renders in Playwright (no errors).
- [x] README updated with the live Pages link.
Future (optional, pre-existing backlog): animals/barn, greenhouse, roguelike Run mode, find testers.

## Next concrete step
Task done. If resumed: nothing required. To redeploy after edits, just `git push` (Pages auto-rebuilds).

## Key decisions & why
- **Vanilla JS + Canvas2D, no build**: runs anywhere; Pages can serve repo root directly.
- **Pages from repo root (not /docs, not gh-pages branch)**: index.html + src already at root;
  simplest. Add `.nojekyll` so Jekyll doesn't interfere with any underscore files.
- gh CLI is NOT installed → use GitHub REST API via curl with `$GH_TOKEN`.

## Gotchas
- `which gh` is empty — no gh CLI. Use `curl` against api.github.com with `$GH_TOKEN`.
- git user already configured: fernforge / fernforgehq@gmail.com (env GIT_AUTHOR_*).
- Date.now()/Math.random() fine in the GAME (browser); only banned in workflow scripts.
- Keep explicit `.js` extensions on imports (native ESM).
- Module paths are relative in index.html → Pages project-site subpath (/greens/) is fine
  because index.html uses relative `./src/...` paths. Verify after deploy.

## How to run/test
```
cd /home/node/workspace
npm start            # http://localhost:5173
node test/smoke.mjs  # headless logic test → ALL PASSED
npm run shots        # render frames to test/shots/*.png (no fonts in container; text blank is non-issue)
```

## Log
- 2026-06-27: cleaned/bounded PROGRESS.md (history → .cb/log/progress-archive-20260627.md); publishing to GitHub Pages.
