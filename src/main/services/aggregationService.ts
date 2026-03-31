import type { AppUsageRecord, RangeUsageItem, RangeUsageView, SortKey, UsageQuery } from "../../shared/types";
import { getRangeBounds } from "./timeRange";
import { SampleRepository } from "./sampleRepository";

export class AggregationService {
  constructor(
    private readonly repository: SampleRepository,
    private readonly getLiveSamples: () => AppUsageRecord[]
  ) {}

  getUsage(query: UsageQuery): RangeUsageView {
    const now = new Date();
    const { start, end } = getRangeBounds(query.range, now);

    const persisted = this.repository.getSamplesBetween(start, end);
    const live = this.getLiveSamples().filter((sample) => {
      const ts = new Date(sample.timestamp).getTime();
      return ts >= start.getTime() && ts < end.getTime();
    });

    const all = persisted.concat(live);

    const grouped = new Map<string, RangeUsageItem>();

    for (const sample of all) {
      const total = sample.rxBytes + sample.txBytes;
      const existing = grouped.get(sample.appId);

      if (existing) {
        existing.rxBytes += sample.rxBytes;
        existing.txBytes += sample.txBytes;
        existing.totalBytes += total;
        if (sample.timestamp > existing.lastSeenAt) {
          existing.lastSeenAt = sample.timestamp;
        }
      } else {
        grouped.set(sample.appId, {
          appId: sample.appId,
          appName: sample.appName,
          rxBytes: sample.rxBytes,
          txBytes: sample.txBytes,
          totalBytes: total,
          share: 0,
          lastSeenAt: sample.timestamp
        });
      }
    }

    const searchTerm = (query.search ?? "").trim().toLowerCase();
    let items = Array.from(grouped.values());
    if (searchTerm) {
      items = items.filter((item) => {
        return item.appName.toLowerCase().includes(searchTerm) || item.appId.toLowerCase().includes(searchTerm);
      });
    }

    const totalBytes = items.reduce((sum, item) => sum + item.totalBytes, 0);

    for (const item of items) {
      item.share = totalBytes > 0 ? item.totalBytes / totalBytes : 0;
    }

    items = this.sortItems(items, query.sortBy ?? "total");

    if (query.limit && query.limit > 0) {
      items = items.slice(0, query.limit);
    }

    return {
      range: query.range,
      totalBytes,
      generatedAt: now.toISOString(),
      items
    };
  }

  getTopApps(range: UsageQuery["range"], limit: number): RangeUsageItem[] {
    return this.getUsage({ range, limit }).items;
  }

  private sortItems(items: RangeUsageItem[], sortBy: SortKey): RangeUsageItem[] {
    return [...items].sort((a, b) => {
      if (sortBy === "download") {
        return b.rxBytes - a.rxBytes;
      }
      if (sortBy === "upload") {
        return b.txBytes - a.txBytes;
      }
      return b.totalBytes - a.totalBytes;
    });
  }
}
