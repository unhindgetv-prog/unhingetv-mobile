// Minimal Metro config extending Expo's defaults.
// expo-doctor flags any project that has Metro-related references (often picked
// up from build artifacts or transitive packages) but doesn't have a config
// extending expo/metro-config. This file satisfies that check by explicitly
// using Expo's defaults — equivalent to having no custom config, just stated
// explicitly so Expo's tooling can verify it.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Watch ../shared (root-level shared directory) if it exists, for cross-package
// imports between web and mobile. No-op if the directory doesn't exist.
// (Documented in ARCHITECTURE_AUDIT.md as the path for shared types/constants.)
const path = require("node:path");
const fs = require("node:fs");
const sharedDir = path.resolve(__dirname, "..", "shared");
if (fs.existsSync(sharedDir)) {
  config.watchFolders = [...(config.watchFolders ?? []), sharedDir];
}

module.exports = config;
