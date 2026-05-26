# UnhingeTV iOS — App Review Risk Report

Audit date: 2026-05-26. Bundle `com.unhingetv.app`, Team `NF9KUYJ4W7`, ASC `6772856553`.
Severity legend: **P0 reject** / **P1 likely-rejection** / **P2 risk** / **OK**.

> Network checks (curl/WebFetch) were denied in this sandbox. Items marked **VERIFY** need a live HTTP probe before submission.

---

## 1. Guideline 3.1.1 — IAP exclusivity
- **OK** — No `stripe`, `checkout.stripe`, `subscribe.unhingetv.com`, `billing.unhingetv.com`, or web `/subscribe` URL referenced anywhere under `mobile/`. Grep returned zero matches.
- **OK** — `mobile/app/(auth)/subscribe.tsx` uses only RNIAP (`purchaseSubscription`), no external links.
- **P2** — `subscribe.tsx:174` shows the strings `unhingetv.com/terms · unhingetv.com/privacy` as plain text (not tappable). Safe today; do NOT convert to tappable web links pre-purchase (would create a 3.1.1 risk).

## 2. Guideline 3.1.2 — Subscription disclosure
- **OK** — Length (`MONTHLY` / `YEARLY`), localized price (`formatPrice`), and cadence (`/month`, `/year`) shown — `subscribe.tsx:138-156`.
- **OK** — Auto-renew + cancellation disclosed — `subscribe.tsx:166-172` ("auto-renew unless canceled… Manage or cancel anytime in your App Store account settings").
- **P1** — Terms/Privacy are displayed as **non-tappable text** (`subscribe.tsx:173-175`). Apple wants functional links to ToU + Privacy on the paywall. **Fix:** wrap in `<TouchableOpacity onPress={() => Linking.openURL('https://unhingetv.com/terms')}>` (Privacy similarly). Opening a web link AFTER user has read disclosure is allowed; the rule is no external *purchase* mechanism.

## 3. Guideline 2.1 — App Completeness
- **OK** — No `TODO`/`FIXME`/`Lorem ipsum`/`REPLACE` strings in `mobile/app/`. All `placeholder` hits are legitimate `TextInput placeholder=` props.
- **P1** — `account.tsx:187` and `account.tsx:192` have menu items "My Watchlist" and "Settings" with `onPress={() => {/* Navigate to watchlist */}}` — **dead buttons**. Apple reviewers tap everything. **Fix:** either wire them to real screens or remove the menu items for v1.0.
- **P0 BLOCKER (Empty Catalog)** — Per memory, all 6 shows are `comingSoon=true` and only 2 episodes are `muxStatus=READY`. The Home tab will render a row of "Notify Me" coming-soon cards with no playable content. Reviewer will reject 2.1 "no content to review." **Fix before submit:** flip ≥1 show to `comingSoon=false` AND ensure ≥3 episodes are `muxStatus=READY` for that show. SQL: `UPDATE shows SET "comingSoon"=false WHERE slug='<slug>';`

## 4. Guideline 5.1.1 — Privacy Policy reachable in-app
- **P0** — Privacy Policy is NOT reachable from the Account/Settings screen. `account.tsx` has no Privacy or Terms menu item. **Fix:** add MenuItems "Privacy Policy" and "Terms of Use" that `Linking.openURL` to the apex URLs.
- **P1** — Privacy not tappable on the paywall (see §2). Same root cause.

## 5. Guideline 5.1.5 — In-app account deletion
- **P0 REJECT** — Zero matches for `delete account` / `deleteAccount` / `/api/account/delete` in mobile/. Web has `web/app/api/account/delete/route.ts` but mobile never calls it. **Fix:** add a "Delete Account" MenuItem in `account.tsx` that POSTs to `/api/account/delete` after a confirm Alert, then logs out. Apple rejects 100% of subscription apps without this since June 2022.

## 6. Guideline 1.1.6 — Age gate
- **P1** — `age-gate.tsx` works (DOB ≥18, AsyncStorage `@unhingetv/age_verified_at`) but it is **NEVER ENFORCED**. `_layout.tsx:30-44` declares the stack screen, but there is no boot-time redirect calling `hasPassedAgeGate()` to push the user there. First launch goes straight to `(tabs)`. **Fix:** in `_layout.tsx` (or `(tabs)/_layout.tsx`), gate initial route on `hasPassedAgeGate()`; if false, `router.replace('/age-gate')` before rendering tabs. Also clear the AsyncStorage key on logout so a different user reverifies.

## 7. Guideline 4.0 — Design / iPad
- **P1** — `app.json:17` `"supportsTablet": true` plus `UISupportedInterfaceOrientations~ipad` includes landscape — meaning Apple WILL test on iPad in landscape. Mobile is built portrait-only (`orientation: "portrait"`). Likely UI breakage on iPad. **Fix for v1.0:** set `"supportsTablet": false` and remove the `~ipad` orientations block to dodge iPad review entirely. iPad can come in v1.1.

## 8. Guideline 5.1.1(v) — Sign in with Apple
- **OK** — No Google/Facebook/Twitter OAuth in mobile. Only email/password (`(auth)/login.tsx`, `signup.tsx`). SIWA not required.
- `@expo-google-fonts/*` matches are fonts, not OAuth — false positive.

## 9. Guideline 3.1.3(b) — Multiplatform Services
- **OK** — Mobile login is email/password against `/api/auth/session`. No outbound link to a web subscribe page. Web Stripe subscribers can sign in on iOS and stream — compliant reader-app pattern (though we also offer IAP, which is allowed).

## 10. Restore Purchases
- **P0 REJECT** — Zero matches for `restorePurchases` / `Restore Purchases` in mobile/. Required button is missing. **Fix:** add `restorePurchases()` helper in `lib/iap.ts` (call `getAvailablePurchases()` from RNIAP, post each to `/api/iap/validate`), wire a MenuItem in `account.tsx` titled "Restore Purchases."

## 11. Broken endpoints — VERIFY
Could not curl-check (shell denied). User must verify manually before submit:
- `GET https://unhingetv.com/api/shows` → 200 JSON
- `GET https://unhingetv.com/api/shows/coming-soon` → 200 JSON
- `POST https://unhingetv.com/api/iap/validate` → 400/401 (not 5xx) with empty body
- `POST https://unhingetv.com/api/webhooks/apple` → 400/401 (not 5xx)
- `GET https://unhingetv.com/api/auth/session` → 200 JSON
- `GET https://unhingetv.com/.well-known/apple-app-site-association` → 200 JSON (file verified locally at `web/public/.well-known/apple-app-site-association`, `appID = NF9KUYJ4W7.com.unhingetv.app` — **OK**)
- `GET https://unhingetv.com/terms` → 200
- `GET https://unhingetv.com/privacy` → 200
- `GET https://unhingetv.com/dmca` → 200

**P2 config issue** — `app.json:118` sets `extra.apiUrl = "https://unhingetv.vercel.app"`, but `lib/iap.ts:39` falls back to `https://unhingetv.com`. They disagree. The Vercel-deployment URL works but the AASA + branding are on apex. **Fix:** set `extra.apiUrl = "https://unhingetv.com"` for consistency.

## 12. Empty catalog — see §3 P0.

## 13. Mobile working-tree dirtiness — VERIFY
Could not `git status` (shell denied). Per memory there are uncommitted icon/splash/app.json edits. **Fix:** before `eas build --platform ios --profile production`, commit the working tree so EAS uses a clean checkout and the build is reproducible.

---

## Submission Blocker Summary (must fix before upload)

| # | Severity | Item | File |
|---|---|---|---|
| A | P0 | Add **Delete Account** flow + button | `mobile/app/(tabs)/account.tsx`, new `lib/account.ts` |
| B | P0 | Add **Restore Purchases** button + helper | `mobile/app/(tabs)/account.tsx`, `mobile/lib/iap.ts` |
| C | P0 | Add **Privacy + Terms** links in Account screen | `mobile/app/(tabs)/account.tsx` |
| D | P0 | Enforce **age gate** on launch | `mobile/app/_layout.tsx` |
| E | P0 | Publish ≥1 show with ≥3 READY episodes | DB: `UPDATE shows SET "comingSoon"=false WHERE slug=…` |
| F | P1 | Make Terms/Privacy **tappable** on paywall | `mobile/app/(auth)/subscribe.tsx:173` |
| G | P1 | Remove dead "Watchlist"/"Settings" menu items | `mobile/app/(tabs)/account.tsx:184-194` |
| H | P1 | Disable iPad support for v1.0 (`supportsTablet:false`) | `mobile/app.json:17` |
| I | P2 | Fix `extra.apiUrl` to apex | `mobile/app.json:118` |
| J | P2 | Verify endpoints + commit working tree | shell |
