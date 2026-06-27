# Publishing Greens & Making Money

Greens is a **pure static HTML5 game** (~98 KB, no build step, no server, no backend).
That makes it about the cheapest and easiest kind of game to ship. Run:

```bash
npm run dist      # → dist/greens-web.zip  (index.html at root, ready to upload)
```

## Fastest path to live + earning (do this first)

**itch.io — HTML5 game, ~15 minutes, free to start, built-in payments.**
1. Create an account at itch.io → **Dashboard → Create new project**.
2. Kind of project: **HTML**. Tick **"This file will be played in the browser."**
3. Upload `dist/greens-web.zip`. Set the viewport to **480 × 270** (tick "Click to launch in fullscreen" — the canvas auto-scales).
4. Pricing: **"$X or more" with a suggested price** (e.g. suggested $4.99, minimum $0) — pay-what-you-want maximizes downloads *and* lets fans pay you. itch lets you keep the default revenue share (you choose what cut itch takes; default 10%). Payments go to your PayPal/Stripe.
5. Add 3–5 screenshots (use `npm run shots`), a GIF, and the tagline. Publish.

That's a storefront with payments, ratings, and a community in under an hour, zero hosting cost.

## Free hosting for a "play instantly" link (marketing funnel)

Host the same files for free so you can link it anywhere (Reddit, Twitter/X, Discord):
- **Netlify Drop**: drag the project folder onto app.netlify.com/drop → instant URL.
- **GitHub Pages**: push the repo, enable Pages on the root — `index.html` just works.
- **Cloudflare Pages / Vercel**: connect the repo, no build command, output dir = repo root.

Use the free web build as a demo; sell the "supporter"/extra-content version on itch & Steam.

## Money models (ranked by effort-to-reward for a solo dev)

1. **Pay-what-you-want on itch.io** (lowest effort). Ship now, gather wishlists/feedback.
2. **Premium on Steam** ($5–10). Steam is where PC players *expect to pay* and wishlists drive
   launch-day sales. Wrap the existing web build in **Electron** or **Tauri** (the game already
   runs in a webview unchanged) and ship it. Steam Direct is a one-time **$100** fee per game.
   This is the single biggest revenue lever — Steam dwarfs itch for paid sales.
3. **Web monetization / ads** if you keep it free-to-play in the browser: portals like
   **CrazyGames, Poki, Newgrounds, Armor Games** pay revenue-share for hosting HTML5 games and
   have huge built-in traffic. Good for reach; lower per-player revenue than premium.
4. **Mobile** (later): wrap with **Capacitor** → Android/iOS. Touch controls already exist.
   Sell as a paid app or free + one-time "remove limits" IAP.
5. **Cosmetic / content DLC** once you have an audience: new seed packs, areas, character skins.

## Recommended launch sequence

1. **This week:** `npm run dist` → upload to itch.io as pay-what-you-want. Post the free web
   link to r/incremental_games, r/farmingsimulator-style subs, r/WebGames, and indie Discords.
   Ask for feedback; iterate.
2. **Build a Steam page now** (wishlists compound for months before launch). Capsule art +
   trailer + the screenshots. Even an unfinished page collects wishlists.
3. **Wrap for Steam with Tauri/Electron**, add a couple of "premium" touches (more content,
   Steam achievements mapped to the in-game ones, cloud saves), launch at $6.99 with a launch
   discount. Wishlists convert best in the first 48 hours.
4. **Submit the web build to CrazyGames/Poki** for ad revenue + discovery in parallel.

## Why this game is well-positioned to sell

- **Tiny & instant** (98 KB) — loads immediately in any browser, great for portals & demos.
- **No backend or running costs** — 100% of revenue is profit after store fees.
- **Cozy farming-RPG is an evergreen, high-LTV genre** (Stardew-likes sell for years).
- **Low floor (Smart Tool, tutorial, prompts) + high ceiling (skills, mine depth, achievements,
  almanac, story)** — broad appeal and long play sessions = good reviews & word-of-mouth.

### Quick cost/return snapshot
| Channel | Upfront cost | Effort | Revenue potential |
|---|---|---|---|
| itch.io (PWYW) | $0 | ~15 min | Low–med, immediate |
| Free web + portals (CrazyGames/Poki) | $0 | ~1 day | Med (ad rev-share, big traffic) |
| Steam (Tauri/Electron wrap) | $100 | ~1 week | **High** (premium sales + wishlists) |
| Mobile (Capacitor) | $25 (Android) / $99/yr (iOS) | ~1 week | Med |

**TL;DR:** `npm run dist`, upload to itch.io today (free, pay-what-you-want), put a free web
build on portals for traffic, and stand up a Steam page to collect wishlists — then wrap the
exact same build with Tauri and sell it on Steam for the real money.
