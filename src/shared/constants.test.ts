import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./constants";

describe("DEFAULT_SETTINGS", () => {
  it("keeps alert thresholds for v1.1", () => {
    expect(DEFAULT_SETTINGS.dailyThresholdGb).toBe(2);
    expect(DEFAULT_SETTINGS.burstThresholdMb).toBe(300);
    expect(DEFAULT_SETTINGS.alertCooldownMinutes).toBe(15);
  });
});
