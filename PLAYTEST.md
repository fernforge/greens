# Greens — Playtest Brief (Phase 0: the breeding hook)

**Status: prototype built & ready for testers.** This doc is the ready-to-post
package + what we want feedback on. (See the "Where to post" research at the bottom.)

## The pitch (lead with this — never "a farming game")
> **Greens — a farming game where you cross-breed plants to engineer & share legendary
> strains.** Splice two seeds at the breeding bench, get a brand-new strain with mixed,
> mutated genes (color, yield, growth speed, value, hardiness) — then trade it with anyone
> as a short seed code. The whole game is ~105 KB and plays instantly in a browser.

## How to play (pick one)
- **Instant, no install:** open `dist/greens-web.zip` → drag the folder onto
  [app.netlify.com/drop](https://app.netlify.com/drop) → get a public URL in ~20 s. (Or
  itch.io HTML5 upload — see `DEPLOY.md`.)
- **Local:** `npm start` → http://localhost:5173

## The 30-second path to the hook (tell testers this)
1. New game → walk to the **Breeding Bench** (right of your house, has a sign).
2. Pick **two different seeds** (you start with Lettuce, Radish, Parsnip) → **Breed**.
3. You get a new **strain** with a new name + color. Plant it, water it — watch it grow a
   *different color*. Harvest it; it's worth more.
4. **Copy Code** and share your strain; **Import Code** to grow someone else's.

## What we're validating (the Phase 0 question)
Does the "**I made a new plant!**" moment land? Specifically:
1. Is breeding **satisfying and clear** (did you "get it" without help)?
2. Is seeing your strain grow in a **new color** a payoff worth chasing?
3. Would you **share/trade** strain codes with friends? Is that a reason to keep playing?
4. What would make you breed "just one more"?

## Feedback form (paste answers anywhere)
- First reaction to the breeding bench (1–10) + why:
- Did you understand it without reading anything? (Y/N)
- Coolest strain you made (name / what was special):
- Did you copy or import a code? Would you?
- One thing that would make this a "wishlist it" game:

---

## Ready-to-paste posts

**Chirper.ai / agent social network (agent-to-agent):**
> 🌱 Built a tiny (105 KB) browser farming game with a twist: you **cross-breed crops** to
> engineer new strains (genes for color/yield/speed/value), and share them as seed codes.
> Looking for quick playtest reactions — does the breeding hook land? [LINK]

**Reddit r/WebGames / r/playmygame / r/incremental_games:**
> [WIP] Greens — a farming game where you *breed* plants to make new strains and share them
> as codes. 105 KB, instant play in browser, no install. Would love feedback on whether the
> breeding loop is fun. [LINK]

**itch.io devlog / indie Discords (#playtest, #feedback-swap):**
> Prototyping the hook for my farming game: cross-breeding crops into shareable strains.
> 2-min play, browser, free. Brutal feedback welcome — is breeding worth building the game around? [LINK]

---

## Where to post — research (June 2026)

**The honest finding:** there is currently **no agent network that lets an outside agent
post with zero human setup.** The two real "social networks for AI agents" both require a
one-time human provisioning step (the exact thing we wanted to avoid):
- **Moltbook** (excluded by you; now Meta-owned, ~1.5 M agents): the human shares a signup
  link with their agent, which then self-registers. Posting needs that provisioning.
- **Chirper.ai** (~65 K agents, X-like, agent-to-agent): you create a "Chirper" persona from
  *your* account; it then posts autonomously. Still needs the initial human-created account.

Human playtest channels (Reddit, itch.io, indie Discords, r/playmygame) reach **real**
players, but posting there requires an account + captcha/email I can't complete autonomously
from the sandbox.

**Recommendation (lowest effort for you, ~2 min total, then hands-off):**
1. Drag `dist/greens-web.zip`'s folder to Netlify Drop → public URL (≈20 s).
2. Either: (a) create one Chirper at chirper.ai and paste the agent post above (it then runs
   autonomously), **or** (b) paste the Reddit post above to r/WebGames for real humans.
3. Send me the feedback and I'll iterate.

I did **not** auto-create accounts or post on your behalf — those are outward-facing actions
needing credentials/captcha, and faking a post would be worse than useless. Everything above
is staged so the actual posting is copy-paste.
