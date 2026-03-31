import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { SampleRepository } from "./sampleRepository";

describe("SampleRepository", () => {
  async function createRepo(): Promise<{ repo: SampleRepository; dir: string }> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "traffic-monitor-repo-"));
    const repo = new SampleRepository(dir);
    await repo.init();
    return { repo, dir };
  }

  it("stores and queries samples by range", async () => {
    const { repo } = await createRepo();

    await repo.appendSamples([
      {
        appId: "appA",
        appName: "a.exe",
        rxBytes: 100,
        txBytes: 20,
        timestamp: "2026-03-30T00:00:00.000Z"
      },
      {
        appId: "appB",
        appName: "b.exe",
        rxBytes: 40,
        txBytes: 10,
        timestamp: "2026-03-31T00:00:00.000Z"
      }
    ]);

    const inRange = repo.getSamplesBetween(
      new Date("2026-03-29T23:59:00.000Z"),
      new Date("2026-03-30T23:59:59.000Z")
    );

    expect(inRange).toHaveLength(1);
    expect(inRange[0].appId).toBe("appA");
  });

  it("prunes samples older than cutoff", async () => {
    const { repo } = await createRepo();

    await repo.appendSamples([
      {
        appId: "old",
        appName: "old.exe",
        rxBytes: 1,
        txBytes: 1,
        timestamp: "2025-01-01T00:00:00.000Z"
      },
      {
        appId: "new",
        appName: "new.exe",
        rxBytes: 2,
        txBytes: 2,
        timestamp: "2026-03-30T00:00:00.000Z"
      }
    ]);

    await repo.pruneOlderThan(new Date("2026-01-01T00:00:00.000Z"));

    const all = repo.getSamplesBetween(new Date("2024-01-01T00:00:00.000Z"), new Date("2027-01-01T00:00:00.000Z"));
    expect(all).toHaveLength(1);
    expect(all[0].appId).toBe("new");
  });

  it("persists locale setting", async () => {
    const { repo, dir } = await createRepo();

    const saved = await repo.saveSettings({ locale: "en-US" });
    expect(saved.locale).toBe("en-US");

    const repoReloaded = new SampleRepository(dir);
    await repoReloaded.init();
    expect(repoReloaded.getSettings().locale).toBe("en-US");
  });
});
