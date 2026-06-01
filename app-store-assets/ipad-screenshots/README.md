# iPad App Store Screenshots — STATUS: DRAFT (web-rendered)

**Generated:** 2026-06-01 via `../_make-ipad-screenshots.mjs` (Playwright + Edge against live https://unhingetv.com).

## What these are
Real screenshots of the live UnhingeTV product, rendered in an iPad-sized
browser viewport at the **exact App Store iPad resolution 2048×2732** (12.9"/13"
portrait). All 5 verified at correct dimensions.

- `ipad13-web-01-home.png` — home + age gate + Finding Love for EJ hero + Trending rail
- `ipad13-web-02-shows.png` — shows catalog
- `ipad13-web-03-subscribe.png` — subscription paywall
- `ipad13-web-04-login.png` — login
- `ipad13-web-05-privacy.png` — privacy

## ⚠️ Before shipping the iPad listing
These are WEB-rendered drafts, not native iPad UIKit captures. The native iPad
app layout (once `ios.supportsTablet: true`) may differ. Apple accepts
correctly-sized PNGs, so these are usable, but you should:
1. Set `app.json` → `ios.supportsTablet: true` (do NOT do this on the in-review
   iPhone build — wait until iPhone v1.0 is approved, then a separate iPad-enabled build).
2. Build + run on an **iPad Pro 13" Simulator on a Mac** and recapture native shots.
3. Replace these drafts, or keep them if the native layout matches.

## Do NOT
- Do not flip `supportsTablet` on the build currently in App Review.
- Do not present these as native captures — they're labeled `web` for that reason.
