import { describe, expect, it } from "vitest";
import { calculateDeltaFromSnapshots } from "./snapshotDelta";

describe("calculateDeltaFromSnapshots", () => {
  it("computes deltas between snapshots", () => {
    const previous = {
      timestamp: "2026-03-30T00:00:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 100, txBytes: 10 }
      }
    };

    const current = {
      timestamp: "2026-03-30T00:01:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 160, txBytes: 30 }
      }
    };

    expect(calculateDeltaFromSnapshots(previous, current)).toEqual([
      {
        appId: "appA",
        appName: "a.exe",
        rxBytes: 60,
        txBytes: 20,
        timestamp: "2026-03-30T00:01:00.000Z"
      }
    ]);
  });

  it("treats counter reset as full current usage", () => {
    const previous = {
      timestamp: "2026-03-30T00:00:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 300, txBytes: 220 }
      }
    };

    const current = {
      timestamp: "2026-03-30T00:01:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 15, txBytes: 20 }
      }
    };

    expect(calculateDeltaFromSnapshots(previous, current)[0].rxBytes).toBe(15);
    expect(calculateDeltaFromSnapshots(previous, current)[0].txBytes).toBe(20);
  });

  it("drops unchanged counters", () => {
    const previous = {
      timestamp: "2026-03-30T00:00:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 100, txBytes: 80 }
      }
    };

    const current = {
      timestamp: "2026-03-30T00:01:00.000Z",
      counters: {
        appA: { appName: "a.exe", rxBytes: 100, txBytes: 80 }
      }
    };

    expect(calculateDeltaFromSnapshots(previous, current)).toEqual([]);
  });
});
