import { describe, expect, it } from "vitest";
import type { AppSettings, RangeUsageView } from "../../shared/types";
import { AlertEngine } from "./alertEngine";
import { DEFAULT_SETTINGS } from "../../shared/constants";

function makeSettings(partial: Partial<AppSettings> = {}): AppSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

function makeTodayView(totalBytes: number): RangeUsageView {
  return {
    range: "today",
    totalBytes,
    generatedAt: "2026-03-31T00:00:00.000Z",
    items: [
      {
        appId: "appA",
        appName: "chrome.exe",
        rxBytes: totalBytes,
        txBytes: 0,
        totalBytes,
        share: 1,
        lastSeenAt: "2026-03-31T00:00:00.000Z"
      }
    ]
  };
}

describe("AlertEngine", () => {
  it("triggers daily threshold alert", () => {
    const engine = new AlertEngine();
    const alerts = engine.evaluate({
      atIso: "2026-03-31T00:00:00.000Z",
      locale: "en-US",
      settings: makeSettings({ dailyThresholdGb: 1 }),
      todayView: makeTodayView(2 * 1024 * 1024 * 1024),
      deltas: []
    });

    expect(alerts.some((item) => item.body.includes("chrome.exe"))).toBe(true);
    expect(alerts[0]?.type).toBe("daily");
  });

  it("respects cooldown", () => {
    const engine = new AlertEngine();
    const settings = makeSettings({ dailyThresholdGb: 1, alertCooldownMinutes: 15 });

    const first = engine.evaluate({
      atIso: "2026-03-31T00:00:00.000Z",
      locale: "en-US",
      settings,
      todayView: makeTodayView(2 * 1024 * 1024 * 1024),
      deltas: []
    });

    const second = engine.evaluate({
      atIso: "2026-03-31T00:05:00.000Z",
      locale: "en-US",
      settings,
      todayView: makeTodayView(2 * 1024 * 1024 * 1024),
      deltas: []
    });

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBe(0);
  });

  it("triggers burst alert for recent 5 minutes", () => {
    const engine = new AlertEngine();
    const settings = makeSettings({ burstThresholdMb: 100, alertCooldownMinutes: 1 });

    const alerts = engine.evaluate({
      atIso: "2026-03-31T00:00:00.000Z",
      locale: "zh-CN",
      settings,
      todayView: makeTodayView(0),
      deltas: [
        {
          appId: "appA",
          appName: "chrome.exe",
          rxBytes: 120 * 1024 * 1024,
          txBytes: 0,
          timestamp: "2026-03-31T00:00:00.000Z"
        }
      ]
    });

    expect(alerts.some((item) => item.body.includes("5 分钟") || item.body.includes("5-minute"))).toBe(true);
    expect(alerts[0]?.appName).toBe("chrome.exe");
  });
});
