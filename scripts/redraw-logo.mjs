#!/usr/bin/env node
// Redraw / clean / restyle a reference logo with FLUX.1 Kontext via Replicate.
// Zero dependencies (Node 22+ built-in fetch/FormData/Blob).
//
// Setup:
//   1. export REPLICATE_API_TOKEN=...   (set in the Claude Code web env, not in chat)
//   2. Network policy must allow:  api.replicate.com  and  *.replicate.delivery
//
// Usage:
//   node scripts/redraw-logo.mjs --check
//   node scripts/redraw-logo.mjs --input assets/icon-1024.png --out /tmp/redraw.png \
//        --prompt "clean, high-resolution redraw of this exact logo; same composition, colors and style; crisper edges"
//   node scripts/redraw-logo.mjs --model black-forest-labs/flux-kontext-pro   (higher fidelity, ~$0.04)

import fs from "node:fs";
import path from "node:path";

const API = "https://api.replicate.com/v1";

// ── arg parsing ──────────────────────────────────────────────
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith("--")) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) { a[key] = true; }
      else { a[key] = next; i++; }
    } else a._.push(t);
  }
  return a;
}
const args = parseArgs(process.argv.slice(2));

const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = args.model || "black-forest-labs/flux-kontext-dev";
const INPUT = args.input || "assets/icon-1024.png";
const OUT = args.out || "/tmp/redraw-output.png";
const PROMPT = args.prompt ||
  "Clean, high-resolution redraw of this exact logo. Keep the same composition, layout, lettering, colors and overall style. Sharpen edges, remove compression artifacts, professional brand-quality finish. Do not add or remove elements.";
const ASPECT = args.aspect || "match_input_image";
const FORMAT = args.format || "png";

function die(msg, code = 1) { console.error("✖ " + msg); process.exit(code); }
function info(msg) { console.log(msg); }

if (!TOKEN) {
  die("REPLICATE_API_TOKEN is not set.\n" +
      "  Add it to your Claude Code web environment settings (env var), then re-run.\n" +
      "  Get a token at https://replicate.com/account/api-tokens");
}

const authHeaders = { Authorization: `Bearer ${TOKEN}` };

async function safeFetch(url, opts) {
  try { return await fetch(url, opts); }
  catch (e) {
    die(`Network call to ${new URL(url).host} failed: ${e.message}\n` +
        "  This is usually the environment's network policy blocking the host.\n" +
        "  Allowlist: api.replicate.com and *.replicate.delivery\n" +
        "  Docs: https://code.claude.com/docs/en/claude-code-on-the-web");
  }
}

// ── preflight: verify token + connectivity, no cost ──────────
async function check() {
  info("Preflight: verifying token + network to api.replicate.com ...");
  const r = await safeFetch(`${API}/account`, { headers: authHeaders });
  if (r.status === 401) die("Token rejected (401). Double-check REPLICATE_API_TOKEN.");
  if (!r.ok) die(`Unexpected response: ${r.status} ${await r.text()}`);
  const acct = await r.json();
  info(`✔ Token OK — account: ${acct.username || acct.type || "(unknown)"}`);
  info("✔ Network to api.replicate.com OK");
  info("Ready. Run without --check to generate (≈$0.025 for flux-kontext-dev).");
}

// ── upload reference image via Files API ─────────────────────
async function uploadImage(file) {
  if (!fs.existsSync(file)) die(`Input image not found: ${file}`);
  const bytes = fs.readFileSync(file);
  info(`Uploading reference (${(bytes.length / 1024 | 0)}KB): ${file}`);
  const form = new FormData();
  form.append("content", new Blob([bytes], { type: "image/png" }), path.basename(file));
  const r = await safeFetch(`${API}/files`, { method: "POST", headers: authHeaders, body: form });
  if (!r.ok) die(`File upload failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const url = j?.urls?.get;
  if (!url) die("Upload succeeded but no file URL returned.");
  return url;
}

// ── create prediction (synchronous wait) ─────────────────────
async function predict(inputImageUrl) {
  info(`Model: ${MODEL}`);
  info(`Prompt: ${PROMPT}`);
  const body = {
    input: {
      prompt: PROMPT,
      input_image: inputImageUrl,
      aspect_ratio: ASPECT,
      output_format: FORMAT,
    },
  };
  const r = await safeFetch(`${API}/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify(body),
  });
  if (r.status === 402) die("Payment required (402): add billing/credit to your Replicate account.");
  if (r.status === 422) die(`Invalid input (422): ${await r.text()}`);
  if (!r.ok) die(`Prediction request failed: ${r.status} ${await r.text()}`);
  let pred = await r.json();

  // Fallback polling if 'wait' returned before completion
  const terminal = new Set(["succeeded", "failed", "canceled"]);
  let tries = 0;
  while (!terminal.has(pred.status) && tries++ < 60) {
    await new Promise((res) => setTimeout(res, 2000));
    const pr = await safeFetch(`${API}/predictions/${pred.id}`, { headers: authHeaders });
    pred = await pr.json();
    info(`  status: ${pred.status}`);
  }
  if (pred.status !== "succeeded") die(`Generation ${pred.status}: ${pred.error || "(no detail)"}`);
  return pred;
}

async function download(pred) {
  let url = pred.output;
  if (Array.isArray(url)) url = url[0];
  if (typeof url !== "string") die(`Unexpected output shape: ${JSON.stringify(pred.output)}`);
  info(`Downloading result: ${url}`);
  const r = await safeFetch(url, {});
  if (!r.ok) die(`Output download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  info(`✔ Saved ${(buf.length / 1024 | 0)}KB → ${OUT}`);
  if (pred.metrics?.predict_time) info(`  predict_time: ${pred.metrics.predict_time}s`);
}

(async () => {
  if (args.check) { await check(); return; }
  const imgUrl = await uploadImage(INPUT);
  const pred = await predict(imgUrl);
  await download(pred);
})().catch((e) => die(e.stack || e.message));
