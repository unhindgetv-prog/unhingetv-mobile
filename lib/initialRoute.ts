/**
 * Pure routing decisions for app entry. Kept free of any `react-native` import
 * so it can be unit-tested in a plain Node/vitest environment. Callers read
 * `Platform.isTV` and pass it in.
 *
 * Route groups:
 *   - "age-gate" : 17+ gate, shown first launch on every device
 *   - "(tv)"     : 10-foot / D-pad UI for TV devices
 *   - "(tabs)"   : touch UI for phones & tablets
 */
export type AppRouteGroup = "(tv)" | "(tabs)" | "age-gate";

/**
 * The Stack's `initialRouteName`.
 * - Not past the age gate → "age-gate" (all devices).
 * - Past the gate on a TV → "(tv)".
 * - Past the gate on phone/tablet → "(tabs)".
 */
export function resolveInitialRoute(agePassed: boolean, isTV: boolean): AppRouteGroup {
  if (!agePassed) return "age-gate";
  return isTV ? "(tv)" : "(tabs)";
}

/** Where to send the user immediately after they pass the age gate. */
export function postAgeGateRoute(isTV: boolean): "/(tv)" | "/(tabs)" {
  return isTV ? "/(tv)" : "/(tabs)";
}
