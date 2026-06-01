/**
 * iPad App Store screenshot generator — captures the LIVE UnhingeTV web product
 * at the exact App Store iPad resolution (2048×2732, 12.9"/13" portrait).
 *
 * IMPORTANT / HONESTY: these are REAL screenshots of the real product rendered in
 * an iPad-sized browser viewport — NOT native UIKit captures. They are valid as
 * App Store iPad screenshots (Apple accepts correctly-sized PNGs), but the
 * native iPad APP layout (once supportsTablet:true) may differ. Validate/replace
 * with iPad Simulator captures on a Mac before the iPad listing ships. Labeled
 * `ipad13-web-*` so they're never confused with native captures.
 *
 * Run:  cd mobile/app-store-assets && node _make-ipad-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'C:/Users/prime/unhingetv/mobile/app-store-assets/ipad-screenshots';
mkdirSync(OUT, { recursive: true });

// App Store 12.9"/13" iPad = 2048×2732 px portrait.
// Render at CSS 1024×1366 with deviceScaleFactor 2 → 2048×2732 device pixels.
const VP = { width: 1024, height: 1366 };
const DSF = 2;

const pages = [
  { slug: '01-home',        url: 'https://unhingetv.com/' },
  { slug: '02-shows',       url: 'https://unhingetv.com/shows' },
  { slug: '03-subscribe',   url: 'https://unhingetv.com/subscribe' },
  { slug: '04-login',       url: 'https://unhingetv.com/login' },
  { slug: '05-privacy',     url: 'https://unhingetv.com/privacy' },
];

const browser = await chromium.launch({ channel: 'msedge', args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: VP,
  deviceScaleFactor: DSF,
  colorScheme: 'dark',           // brand is dark/cinematic
  isMobile: false,               // iPad = tablet, not phone UA
});
const results = [];
for (const p of pages) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500); // let hero media/fonts settle
    const file = `${OUT}/ipad13-web-${p.slug}.png`;
    await page.screenshot({ path: file, fullPage: false }); // viewport-exact = 2048×2732
    results.push({ page: p.slug, status: resp?.status(), file, ok: true });
  } catch (e) {
    results.push({ page: p.slug, ok: false, err: String(e).slice(0, 120) });
  } finally {
    await page.close();
  }
}
await browser.close();

console.log('\n=== iPad screenshots (2048×2732, dark, live web) ===');
for (const r of results) console.log(r.ok ? `  OK  ${r.page}  [HTTP ${r.status}]  ${r.file}` : `  FAIL ${r.page}  ${r.err}`);
console.log(`\n${results.filter(r=>r.ok).length}/${results.length} captured → ${OUT}`);
console.log('NOTE: web-rendered iPad-sized drafts. Validate/replace with iPad Simulator captures on a Mac before shipping the iPad listing.');
