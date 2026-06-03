// Expo config plugin: attach the Android TV Leanback launcher banner (320x180).
// Sets android:banner on <application> and copies the drawable during prebuild.
// Asset: assets/androidtv-banner-320x180.png (320x180, exact 16:9).
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const BANNER_SRC = "assets/androidtv-banner-320x180.png";

const withAndroidTvBanner = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$["android:banner"] = "@drawable/tv_banner";
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, BANNER_SRC);
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "drawable"
      );
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, "tv_banner.png"));
      return cfg;
    },
  ]);

  return config;
};

module.exports = withAndroidTvBanner;
