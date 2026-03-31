import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { ProbeUsageItem } from "../../shared/types";
import { SampleRepository } from "./sampleRepository";
import { CollectorService, type CollectorProbe } from "./collectorService";
import { AggregationService } from "./aggregationService";
import { rangeUsageToCsv } from "./csvExport";

class FakeProbe implements CollectorProbe {
  private callCount = 0;

  async collectInterval(): Promise<ProbeUsageItem[]> {
    this.callCount += 1;
    if (this.callCount === 1) {
      return [{ attributionId: "C:\\Chrome\\chrome.exe", rxBytes: 100, txBytes: 50 }];
    }

    return [
      { attributionId: "C:\\Chrome\\chrome.exe", rxBytes: 40, txBytes: 20 },
      { attributionId: "D:\\Tools\\sync.exe", rxBytes: 0, txBytes: 90 }
    ];
  }
}

describe("collector + aggregation integration", () => {
  it("collects deltas, flushes samples, and exports csv", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "traffic-monitor-integration-"));
    const repo = new SampleRepository(dir);
    await repo.init();

    const probe = new FakeProbe();
    const collector = new CollectorService(probe, repo, {
      pollIntervalMs: 1000,
      persistIntervalMs: 60_000,
      retentionDays: 90
    });

    await collector.init();
    await collector.collectNow();
    await collector.collectNow();
    await collector.stop();

    const aggregation = new AggregationService(repo, () => []);
    const view = aggregation.getUsage({ range: "today", sortBy: "total" });

    expect(view.totalBytes).toBe(300);
    expect(view.items[0]?.appName).toBe("chrome.exe");

    const csv = rangeUsageToCsv(view);
    expect(csv).toContain("chrome.exe");
    expect(csv).toContain("sync.exe");
  });
});
