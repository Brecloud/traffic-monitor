import { formatBytes } from "../../shared/formatBytes";
import { t } from "../../shared/i18n";
import type { AppSettings, AppUsageRecord, Locale, RangeUsageView } from "../../shared/types";

export interface AlertMessage {
  type: "daily" | "burst";
  body: string;
  appName?: string;
}

interface AlertContext {
  atIso: string;
  locale: Locale;
  settings: AppSettings;
  todayView: RangeUsageView;
  deltas: AppUsageRecord[];
}

export class AlertEngine {
  private recentBursts: Array<{ timestampMs: number; totalBytes: number }> = [];
  private lastAlertAt = new Map<string, number>();

  evaluate(input: AlertContext): AlertMessage[] {
    const { settings } = input;
    if (!settings.alertsEnabled) {
      return [];
    }

    const nowMs = new Date(input.atIso).getTime();
    const cooldownMs = Math.max(1, settings.alertCooldownMinutes) * 60_000;
    const alerts: AlertMessage[] = [];

    const dailyThresholdBytes = Math.max(0, settings.dailyThresholdGb) * 1024 * 1024 * 1024;
    for (const item of input.todayView.items) {
      if (item.totalBytes < dailyThresholdBytes) {
        continue;
      }

      const key = `daily:${item.appId}`;
      if (!this.shouldNotify(key, nowMs, cooldownMs)) {
        continue;
      }

      alerts.push({
        type: "daily",
        appName: item.appName,
        body: t(input.locale, "alert.dailyExceeded", {
          app: item.appName,
          value: formatBytes(item.totalBytes),
          threshold: formatBytes(dailyThresholdBytes)
        })
      });
    }

    const burstThresholdBytes = Math.max(0, settings.burstThresholdMb) * 1024 * 1024;
    const deltaTotal = input.deltas.reduce((sum, record) => sum + record.rxBytes + record.txBytes, 0);

    this.recentBursts.push({ timestampMs: nowMs, totalBytes: deltaTotal });
    this.recentBursts = this.recentBursts.filter((entry) => nowMs - entry.timestampMs <= 5 * 60_000);

    const recentTotal = this.recentBursts.reduce((sum, entry) => sum + entry.totalBytes, 0);

    if (recentTotal >= burstThresholdBytes && this.shouldNotify("burst", nowMs, cooldownMs)) {
      let appName: string | undefined;
      if (input.deltas.length > 0) {
        const topDelta = [...input.deltas].sort(
          (a, b) => b.rxBytes + b.txBytes - (a.rxBytes + a.txBytes)
        )[0];
        appName = topDelta?.appName;
      }

      alerts.push({
        type: "burst",
        appName,
        body: t(input.locale, "alert.burstExceeded", {
          value: formatBytes(recentTotal),
          threshold: formatBytes(burstThresholdBytes)
        })
      });
    }

    return alerts;
  }

  private shouldNotify(key: string, nowMs: number, cooldownMs: number): boolean {
    const last = this.lastAlertAt.get(key);
    if (typeof last === "number" && nowMs - last < cooldownMs) {
      return false;
    }

    this.lastAlertAt.set(key, nowMs);
    return true;
  }
}
