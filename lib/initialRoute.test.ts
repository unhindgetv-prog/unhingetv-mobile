import { describe, it, expect } from "vitest";
import { resolveInitialRoute, postAgeGateRoute } from "./initialRoute";

describe("resolveInitialRoute (H-3 TV boot routing)", () => {
  it("TV device past age gate → (tv) 10-foot UI", () => {
    expect(resolveInitialRoute(true, true)).toBe("(tv)");
  });

  it("phone/tablet past age gate → (tabs) mobile UI", () => {
    expect(resolveInitialRoute(true, false)).toBe("(tabs)");
  });

  it("age gate not passed → age-gate, regardless of device (TV)", () => {
    expect(resolveInitialRoute(false, true)).toBe("age-gate");
  });

  it("age gate not passed → age-gate, regardless of device (phone)", () => {
    expect(resolveInitialRoute(false, false)).toBe("age-gate");
  });
});

describe("postAgeGateRoute", () => {
  it("TV → /(tv)", () => {
    expect(postAgeGateRoute(true)).toBe("/(tv)");
  });
  it("phone/tablet → /(tabs)", () => {
    expect(postAgeGateRoute(false)).toBe("/(tabs)");
  });
});
