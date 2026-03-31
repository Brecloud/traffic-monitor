import type { AppSettings } from "./types";

export const IPC_CHANNELS = {
  getUsage: "traffic:get-usage",
  refresh: "traffic:refresh",
  getSettings: "traffic:get-settings",
  updateSettings: "traffic:update-settings",
  exportCsv: "traffic:export-csv",
  openDataDir: "traffic:open-data-dir",
  dataUpdated: "traffic:data-updated",
  alertClicked: "traffic:alert-clicked",
  windowMinimize: "window:minimize",
  windowHide: "window:hide"
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "zh-CN",
  topN: 8,
  viewMode: "detailed",
  launchAtStartup: false,
  alertsEnabled: true,
  dailyThresholdGb: 2,
  burstThresholdMb: 300,
  alertCooldownMinutes: 15,
  pollIntervalMs: 10_000,
  persistIntervalMs: 60_000,
  retentionDays: 90
};

export const APP_TIMEZONE = "Asia/Singapore";
