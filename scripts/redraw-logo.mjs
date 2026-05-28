#!/usr/bin/env node
// Redraw the app logo via Replicate (black-forest-labs/flux-kontext-pro).
//
// Usage:
//   node scripts/redraw-logo.mjs --check         # verify token + network, no spend
//   node scripts/redraw-logo.mjs                 # redraw assets/icon-1024.png
//   node scripts/redraw-logo.mjs --in <path> --out <path> --prompt "..."
//
// Requires env var REPLICATE_API_TOKEN (r8_...).

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const MODEL = "black-forest-labs/flux-kontext-pro";
const API = "https://api.replicate.com/v1";

function parseArgs(argv) {
  const args = { check: false, in: "assets/icon-1024.png", out: "assets/icon-1024-redraw.png", prompt: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--in") args.in = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--prompt") args.prompt = argv[++i];
  }
  return args;
}

const DEFAULT_PROMPT =
  "Redraw this logo as a clean, crisp, high-resolution vector-style version. " +
  "Preserve the exact same composition, colors, shapes and text. " +
  "Sharpen the edges, remove compression artifacts and noise, keep a transparent or solid background. " +
  "Do not add, remove, or restyle any elements — only make it cleaner and higher quality.";

function requireToken() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error(
      "✗ REPLICATE_API_TOKEN not set.\n" +
        "  Add it as an environment variable in your Claude Code environment settings,\n" +
        "  or run locally with: REPLICATE_API_TOKEN=r8_... node scripts/redraw-logo.mjs"
    );
    process.exit(1);
  }
  return token;
}

async function checkNetwork(token) {
  const res = await fetch(`${API}/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    console.error("✗ Network OK but token rejected (401). Check the token value.");
    process.exit(1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`✗ Network error: ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
    process.exit(1);
  }
  const acct = await res.json().catch(() => ({}));
  return acct;
}

async function toDataUri(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) {
    console.error(`✗ Input image not found: ${abs}`);
    process.exit(1);
  }
  const buf = await readFile(abs);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function createPrediction(token, inputImage, prompt) {
  const res = await fetch(`${API}/models/${MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        input_image: inputImage,
        prompt,
        output_format: "png",
        aspect_ratio: "match_input_image",
        safety_tolerance: 2,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`✗ Failed to start prediction: ${res.status} ${res.statusText}\n${body.slice(0, 500)}`);
    process.exit(1);
  }
  return res.json();
}

async function pollPrediction(token, prediction) {
  let p = prediction;
  while (p.status !== "succeeded" && p.status !== "failed" && p.status !== "canceled") {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`${API}/predictions/${p.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    p = await res.json();
    process.stdout.write(`\r  status: ${p.status}        `);
  }
  process.stdout.write("\n");
  return p;
}

async function downloadOutput(output, outPath) {
  const url = Array.isArray(output) ? output[0] : output;
  if (!url || typeof url !== "string") {
    console.error("✗ Prediction returned no usable image URL.");
    console.error("  output:", JSON.stringify(output));
    process.exit(1);
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ Failed to download result: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const abs = resolve(outPath);
  await writeFile(abs, buf);
  return abs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = requireToken();

  if (args.check) {
    const acct = await checkNetwork(token);
    console.log("✔ Token OK" + (acct.username ? ` (account: ${acct.username})` : ""));
    console.log("✔ Network OK (api.replicate.com reachable)");
    return;
  }

  await checkNetwork(token);
  console.log(`Reading ${args.in} ...`);
  const inputImage = await toDataUri(args.in);

  console.log(`Submitting to ${MODEL} ...`);
  const prediction = await createPrediction(token, inputImage, args.prompt || DEFAULT_PROMPT);

  const done = prediction.status === "succeeded" ? prediction : await pollPrediction(token, prediction);

  if (done.status !== "succeeded") {
    console.error(`✗ Prediction ${done.status}: ${done.error || "(no error message)"}`);
    process.exit(1);
  }

  const saved = await downloadOutput(done.output, args.out);
  console.log(`✔ Redraw saved to ${saved}`);
  const metrics = done.metrics || {};
  if (metrics.predict_time) console.log(`  predict_time: ${metrics.predict_time}s`);
}

main().catch((err) => {
  console.error("✗ Unexpected error:", err.message || err);
  process.exit(1);
});
