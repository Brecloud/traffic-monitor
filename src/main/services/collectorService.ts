import { EventEmitter } from "node:events";
import type { AppUsageRecord, CounterSnapshot, ProbeUsageItem } from "../../shared/types";
import { normalizeProbeItems, extractAppName } from "./normalization";
import { calculateDeltaFromSnapshots } from "./snapshotDelta";
import { SampleRepository } from "./sampleRepository";

export interface CollectorProbe {
  collectInterval(start: Date, end: Date): Promise<ProbeUsageItem[]>;
}

export interface CollectorOptions {
  pollIntervalMs: number;
  persistIntervalMs: number;
  retentionDays: number;
}

function createEmptySnapshot(timestamp: string): CounterSnapshot {
  return {
    timestamp,
    counters: {}
  };
}

export class CollectorService extends EventEmitter {
  private pollTimer: NodeJS.Timeout | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private running = false;
  private isCollecting = false;
  private cursor: Date | null = null;
  private sessionSnapshot: CounterSnapshot | null = null;
  private minuteBuffer = new Map<string, { appName: string; rxBytes: number; txBytes: number }>();

  constructor(
    private readonly probe: CollectorProbe,
    private readonly repository: SampleRepository,
    private options: CollectorOptions
  ) {
    super();
  }

  async init(): Promise<void> {
    const state = this.repository.getState();
    if (state.cursorIso) {
      const parsed = new Date(state.cursorIso);
      if (!Number.isNaN(parsed.getTime())) {
        this.cursor = parsed;
      }
    }

    if (!this.cursor) {
      this.cursor = new Date(Date.now() - this.options.pollIntervalMs);
    }

    const cutoff = new Date(Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000);
    await this.repository.pruneOlderThan(cutoff);
  }

  updateOptions(options: Partial<CollectorOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }

  startPolling(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.pollTimer = setInterval(() => {
      void this.collectNow();
    }, this.options.pollIntervalMs);

    this.flushTimer = setInterval(() => {
      void this.flushBuffer("timer");
    }, this.options.persistIntervalMs);

    void this.collectNow();
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushBuffer("stop");
  }

  getLiveSamples(): AppUsageRecord[] {
    const timestamp = new Date().toISOString();
    return Array.from(this.minuteBuffer.entries()).map(([appId, value]) => ({
      appId,
      appName: value.appName,
      rxBytes: value.rxBytes,
      txBytes: value.txBytes,
      timestamp
    }));
  }

  async collectNow(): Promise<void> {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;
    try {
      const now = new Date();
      const start = this.cursor ?? new Date(now.getTime() - this.options.pollIntervalMs);
      const end = now;

      const raw = await this.probe.collectInterval(start, end);
      const normalized = normalizeProbeItems(raw);

      const previous = this.sessionSnapshot ?? createEmptySnapshot(start.toISOString());
      const next = this.composeNextSnapshot(previous, normalized, end.toISOString());
      const deltas = calculateDeltaFromSnapshots(previous, next);

      this.sessionSnapshot = next;
      this.cursor = end;
      await this.repository.updateState({
        cursorIso: end.toISOString(),
        lastUpdatedIso: end.toISOString()
      });

      this.mergeIntoMinuteBuffer(deltas);
      this.emit("collected", { at: end.toISOString(), records: deltas.length });
    } catch (error) {
      this.emit("error", error);
    } finally {
      this.isCollecting = false;
    }
  }

  private composeNextSnapshot(
    previous: CounterSnapshot,
    probeItems: ProbeUsageItem[],
    timestamp: string
  ): CounterSnapshot {
    const counters: CounterSnapshot["counters"] = { ...previous.counters };

    for (const item of probeItems) {
      const existing = counters[item.attributionId] ?? {
        appName: extractAppName(item.attributionId),
        rxBytes: 0,
        txBytes: 0
      };

      counters[item.attributionId] = {
        appName: existing.appName,
        rxBytes: existing.rxBytes + item.rxBytes,
        txBytes: existing.txBytes + item.txBytes
      };
    }

    return {
      timestamp,
      counters
    };
  }

  private mergeIntoMinuteBuffer(records: AppUsageRecord[]): void {
    for (const record of records) {
      const existing = this.minuteBuffer.get(record.appId) ?? {
        appName: record.appName,
        rxBytes: 0,
        txBytes: 0
      };

      existing.rxBytes += record.rxBytes;
      existing.txBytes += record.txBytes;
      this.minuteBuffer.set(record.appId, existing);
    }
  }

  private async flushBuffer(reason: "timer" | "stop"): Promise<void> {
    if (this.minuteBuffer.size === 0) {
      return;
    }

    const timestamp = new Date().toISOString();
    const records: AppUsageRecord[] = Array.from(this.minuteBuffer.entries()).map(([appId, value]) => ({
      appId,
      appName: value.appName,
      rxBytes: value.rxBytes,
      txBytes: value.txBytes,
      timestamp
    }));

    this.minuteBuffer.clear();

    await this.repository.appendSamples(records);
    await this.repository.updateState({ lastFlushIso: timestamp });
    const cutoff = new Date(Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000);
    await this.repository.pruneOlderThan(cutoff);
    this.emit("flushed", { at: timestamp, reason, records: records.length });
  }
}
