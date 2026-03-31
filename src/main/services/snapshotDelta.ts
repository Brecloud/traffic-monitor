import type { CounterSnapshot, AppUsageRecord } from "../../shared/types";

export function calculateDeltaFromSnapshots(
  previous: CounterSnapshot,
  current: CounterSnapshot
): AppUsageRecord[] {
  const records: AppUsageRecord[] = [];

  for (const [appId, currentCounter] of Object.entries(current.counters)) {
    const prevCounter = previous.counters[appId];

    const deltaRx = !prevCounter
      ? currentCounter.rxBytes
      : currentCounter.rxBytes >= prevCounter.rxBytes
        ? currentCounter.rxBytes - prevCounter.rxBytes
        : currentCounter.rxBytes;

    const deltaTx = !prevCounter
      ? currentCounter.txBytes
      : currentCounter.txBytes >= prevCounter.txBytes
        ? currentCounter.txBytes - prevCounter.txBytes
        : currentCounter.txBytes;

    if (deltaRx <= 0 && deltaTx <= 0) {
      continue;
    }

    records.push({
      appId,
      appName: currentCounter.appName,
      rxBytes: deltaRx,
      txBytes: deltaTx,
      timestamp: current.timestamp
    });
  }

  return records;
}
