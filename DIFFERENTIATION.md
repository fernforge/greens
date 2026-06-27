# Greens — Differentiation Strategy Report

*How a competent Stardew-like becomes a game people seek out by name.*

---

## 1. Honest diagnosis

You're right, and it's worth being blunt about it: **Greens is currently a well-built
member of an oversaturated category, not a game with a reason to exist.** It does the
cozy-farming loop competently (39 crops, mine/combat, fishing, foraging, cooking, NPCs,
skills, quests, achievements, day/night/seasons/weather, saves) — but every one of those
systems is *table stakes* in this genre. Stardew Valley, Coral Island, Fae Farm, Sun Haven,
Roots of Pacha, Travellers Rest, and ~hundreds of itch.io clones already own "Stardew but ___."

The trap to avoid: **"more content" is not a differentiator.** Adding a 50th crop or a 9th
villager makes the game bigger, not different. Competing with Stardew on *breadth* is a fight
you lose — it had a decade and a cult following. You need a **hook**: one sentence a stranger
repeats to a friend. Stardew didn't have that problem because it was early; you're late, so
the hook has to be sharper.

The good news: Greens has two latent, genuine assets that most clones don't:
1. **A thematic identity already half-built** — "Greens," leafy greens, the *Ancient Green*
   story. That's a seed (pun intended) for a mechanic no one else centers on.
2. **A technical edge** — it's **~98 KB, pure procedural, zero-asset, instant-play in any
   browser.** That is a distribution superpower the AAA-asset clones literally cannot match.

This report turns those two assets into a defensible position.

---

## 2. A framework: the five axes you can differentiate on

You don't need to win all five. Pick **one signature mechanic**, reinforce it with **one
structural choice**, and exploit **one distribution edge**.

| Axis | Question it answers | Greens' opportunity |
|---|---|---|
| **Mechanic** | "What do I *do* that's new?" | Crop **genetics / breeding** (see §3.1) |
| **Structure** | "How is a session/run shaped?" | **Roguelike seasonal runs** (short, replayable) |
| **Theme/Narrative** | "What's it *about*?" | Eco-restoration; greens heal a dying valley |
| **Distribution** | "Where & how do people get it?" | **Instant-play web** (98 KB), seed-code sharing |
| **Social** | "Why do players talk about it?" | Shareable strains / farms, daily challenge, leaderboards |

---

## 3. Ranked concept options

Each is scored on **Defensibility** (how hard to copy / how unique), **Fit** (leverage of the
existing ~6,500-LOC codebase), **Effort** (S/M/L), and **Risk**.

### 3.1 ⭐ PRIMARY: "Greens" as a **crop-genetics / plant-breeding** game
**Hook:** *"Stardew meets selective breeding — engineer and discover legendary plant strains,
then share them with the world as a seed code."*

- Crops carry **genes/traits**: yield, growth speed, size, color/pattern, flavor, hardiness
  (drought/frost), value, and rare recessive "wild" traits. Cross-breed two plants → offspring
  inherit a mix (with mutation chance). The core loop becomes *discovery and engineering*, not
  just "plant → water → sell."
- The **Ancient Green** story becomes literal: you're rebuilding a lost genome, hunting rare
  alleles in the wild/forest/mine, stabilizing strains.
- **Killer social feature (web-native, zero backend):** every strain serializes to a short
  **seed code string** players copy/paste to share or challenge friends ("can you out-breed my
  Goldleaf Kale?"). This is the viral loop — content players *create and trade*.
- **Why defensible:** cozy-farming + real genetics depth is a genuinely underserved niche.
  "More crops" clones can't easily bolt this on; it reshapes the whole loop.
- **Fit:** HIGH. You already have a 39-crop data layer (`data/crops.js`), a farming/growth
  system (`systems/farming.js`), and an Almanac for discovery. Genes ride on top of crop
  instances; the breeding UI extends the existing crafting/overlay panels.
- **Effort:** **M.** Add a `genetics.js` system, gene fields to planted crops, a breeding
  bench object + UI, strain registry/codec, and Almanac "strains discovered." No art needed —
  procedural sprites already tint by palette, so gene-driven color/size is basically free.
- **Risk:** Low–med. Must keep it cozy, not a spreadsheet. Mitigate with great visual feedback
  (you can *see* a strain's traits in its sprite) and Smart-Tool-style guidance.
- **Monetization:** premium on Steam/itch; "strain pack" cosmetic DLC; daily breeding challenge
  for retention.

### 3.2 ⭐ STRONG SECOND / COMBINE: **Roguelike seasonal runs** (Stardew × Balatro)
**Hook:** *"A roguelike farming game — draft seeds and perks, survive the season, chase a
high score, and unlock more each run."*

- A "run" = one season (28 days). You **draft** seeds/tools/perks, push for a **harvest score**,
  face escalating events (blights, frosts, market crashes), then bank meta-progression
  (new crops, perks, starting bonuses) for the next run.
- **Why it's hot right now:** the Balatro/“number-go-up + draft” wave is enormous, and *nobody*
  has nailed the cozy-farming-roguelike. Short sessions (5–20 min) are perfect for **web and
  mobile**, where Stardew's 60-hour commitment is a liability.
- **Fit:** HIGH. You already have seasons, skills/perks, weather/events, an economy, and a
  day-cycle to repurpose as the run timer. Mostly a **meta-layer + run setup/score screen**.
- **Effort:** M. Run manager, draft UI, score/results screen, meta-unlock save. Reuses ~80% of
  systems.
- **Risk:** Med — changes the fantasy from "settle down forever" to "one more run." That's a
  *feature* for replayability/virality but alienates pure-cozy players. Could ship as a
  **separate "Run" mode** alongside the existing free-play (best of both).
- **Monetization:** very strong — high replay = high wishlists/retention; daily-seed leaderboard.

> **The power move:** §3.1 (genetics) as the *signature mechanic* + §3.2 (runs) as an optional
> *mode* = a genuinely novel pitch: **"a roguelike where you breed the perfect plant."** Two
> hooks reinforcing each other, both built mostly from systems you already have.

### 3.3 Eco-restoration narrative ("the valley is dying; greens heal it")
**Hook:** *"A farming game with a soul — replant a poisoned valley and watch it come back to life."*
- Land starts barren/grey; your crops literally restore biomes, wildlife, NPCs return. Visible
  world-state change = strong emotional payoff and great trailer/marketing footage.
- **Defensibility:** Med (theme, not mechanic — copyable, but emotionally sticky).
- **Fit:** Med — needs world-state progression + art states (your tinting helps). **Effort: M–L.**
- Best used as **flavor on top of** 3.1/3.2, not the sole hook.

### 3.4 Automation layer (Factorio-lite greens)
**Hook:** *"Cozy farming that becomes a satisfying automated green-production machine."*
- Belts, planters, auto-harvesters, sorters; optimize throughput.
- **Defensibility:** High; **Fit:** Med; **Effort: L** (new sim layer). Appeals to optimizers,
  not cozy players. Higher risk/effort — recommend *later*, not as the launch hook.

### 3.5 Farming deckbuilder
**Hook:** *"Plant cards, combo your greens, score big at harvest."* Balatro-adjacent.
- **Defensibility:** Med (crowded post-Balatro); **Fit:** Med; **Effort: M–L.** Overlaps with
  3.2's appeal but throws away more of the existing sim. Lower priority.

### 3.6 Distribution-led: "the instant farming game"
**Hook:** *"The cozy farm you can play in 1 second, on anything, even offline — 100 KB."*
- Not a mechanic — a **go-to-market** wedge. Lean into the 98 KB instant-play build for
  CrazyGames/Poki/Reddit virality and mobile. **Pair with** a real mechanic hook above.
- **Effort: S** (positioning + portal submissions). Do this *regardless* of which mechanic wins.

---

## 4. Recommendation

**Lead with crop genetics (3.1) as the signature mechanic. Frame it, at launch, with a
roguelike "Run" mode (3.2) for replayability and short-session/mobile/web appeal. Sprinkle
eco-restoration flavor (3.3). Exploit the 98 KB instant-play edge (3.6) for distribution.**

One-line pitch: **"Greens — a roguelike farming game where you breed legendary plant strains
and trade them with the world."** That is a sentence that survives being repeated, and it's
buildable on top of what exists.

Why this combination:
- **Unique & on-brand:** genetics makes "Greens" *mean* something; no major clone owns it.
- **Defensible:** reshapes the core loop, not a cosmetic layer competitors can copy in a patch.
- **Leverages your assets:** procedural sprites make gene-driven visuals nearly free; existing
  crop/farming/almanac systems are the foundation; seed-code sharing needs no servers.
- **Viral & monetizable:** player-created, shareable strains + a daily challenge = the
  word-of-mouth engine a late-entrant genre game desperately needs.

---

## 5. The build path (phased, mapped to the codebase)

**Phase 0 — Validate the hook (1–2 days). Cheapest test first.**
- Prototype genetics minimally: add `gene` fields (yield, speed, color, hardiness) to planted
  crops in `systems/farming.js`; a "breeding bench" object; cross two harvested crops → child
  seed with mixed genes + mutation. Tint the procedural sprite by the color gene so traits are
  *visible*. Ship a tiny build to 20 players / a subreddit. **If the "ooh, I made a new plant"
  moment lands, commit. If not, pivot to 3.2.**

**Phase 1 — Genetics MVP (1–2 weeks)**
- `systems/genetics.js`: gene model, inheritance, mutation, strain naming, **seed-code
  serialize/deserialize** (a short base36 string).
- Breeding Bench UI (extend `ui/overlays.js` crafting panel pattern).
- Almanac gets a **"Strains"** tab (you already have the Almanac tabs).
- Wild rare alleles drop from forage/mine/fishing (ties existing skills into the new loop).

**Phase 2 — Run mode (1–2 weeks)**
- `systems/run.js`: season-as-run timer (reuse `time.js`), draft screen, score formula
  (best strains × value × biodiversity), results + meta-unlock save (extend `state.js`).
- Add as a **menu option** beside "New Farm" so cozy free-play stays intact.
- Events/modifiers reuse the weather system.

**Phase 3 — Social & distribution (ongoing)**
- Daily seed challenge (deterministic from date) + paste-a-code-to-load-a-strain.
- Submit web build to CrazyGames/Poki; open a Steam page to bank wishlists (see `DEPLOY.md`).
- Optional tiny leaderboard (a single serverless function or a free service) — not required to
  launch; seed-code sharing is the zero-backend version.

**Phase 4 — Depth & flavor**
- Eco-restoration world states; automation as an end-game optimizer (3.4) for the optimizer
  crowd once the core hook is proven.

---

## 6. Decision matrix

| Concept | Unique | Code fit | Effort | Replay/viral | Verdict |
|---|---|---|---|---|---|
| **Crop genetics (3.1)** | ★★★★★ | ★★★★★ | M | ★★★★ | **Build — signature hook** |
| **Roguelike runs (3.2)** | ★★★★ | ★★★★★ | M | ★★★★★ | **Build — as a mode** |
| Eco-restoration (3.3) | ★★★ | ★★★ | M–L | ★★★ | Layer on as flavor |
| Automation (3.4) | ★★★★ | ★★★ | L | ★★★ | Later / end-game |
| Deckbuilder (3.5) | ★★★ | ★★ | M–L | ★★★★ | Skip (overlaps 3.2) |
| Instant-web (3.6) | ★★ | ★★★★★ | S | ★★★★ | **Do anyway (GTM)** |

---

## 7. Quick wins to do regardless of the path

- **Rename the pitch, not the game:** every store page/trailer leads with the hook sentence,
  never "a farming RPG." Genre-label = death by comparison.
- **Lean on the 98 KB instant-play angle** in all marketing — it's genuinely remarkable and
  shareable ("a whole farming RPG smaller than one screenshot").
- **One signature visual** for the trailer/capsule (a player *breeding a glowing legendary
  strain*) — the thing the thumbnail promises.
- **Ship the web demo to portals now** to gather feedback while you build the hook.

---

## 8. TL;DR

Greens is a good game with no reason to be chosen over Stardew — yet. Don't fix that with more
crops; fix it with a **hook**. Use the two things this project already has that the clones
don't: the **"Greens" identity** → make it a **plant-breeding/genetics game**, and the **98 KB
instant-play tech** → make it the **shareable, roguelike, play-anywhere** one. Pitch:
**"a roguelike farming game where you breed legendary plant strains and trade them with the
world."** Build genetics first (Phase 0 validates it in two days), add a Run mode, and exploit
web distribution from day one.
