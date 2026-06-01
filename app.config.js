/**
 * Expo app config — function form. Wraps app.json so we can branch
 * on the EAS build profile / env var.
 *
 * Fire TV (EXPO_TV=1, EXPO_PUBLIC_STORE=amazon):
 *   - orientation: "landscape"   ← Fire TV is a 16:9 TV; portrait lock looks broken
 *   - android.banner             ← shows the wide brand tile on the Fire TV launcher
 *                                  (without this, the home-screen tile falls back to
 *                                   the square adaptive icon)
 *
 * Phone (no EXPO_TV):
 *   - orientation: "portrait"    ← preserves existing phone UX
 *   - android.banner harmless: Android phones ignore android:banner; only
 *                              LEANBACK launchers (Fire TV / Android TV) use it
 *
 * iOS / Apple TV are unaffected — iOS orientation is controlled by infoPlist in app.json.
 *
 * Fixes findings from _release-audit/2026-05-17-firetv/AMAZON_FIRETV_QA_REPORT.md
 *   - FINDING 1: screenOrientation=portrait lock on MainActivity
 *   - FINDING 2: empty banner='' on leanback-launchable-activity
 */

export default ({ config }) => {
  const isTV = process.env.EXPO_TV === "1";

  return {
    ...config,
    orientation: isTV ? "landscape" : "portrait",
    android: {
      ...config.android,
      // android:banner — used by Android TV / Fire TV LEANBACK launcher only.
      // Phones ignore it (no schema impact), so we include it unconditionally.
      banner: "./assets/tv-banner.png",
    },
  };
};
