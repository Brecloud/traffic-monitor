export type Locale = "zh-CN" | "en-US";

export type RangeKey = "today" | "yesterday" | "week" | "month";

export type SortKey = "total" | "download" | "upload";

export type ViewMode = "compact" | "detailed";

export interface AppUsageRecord {
  appId: string;
  appName: string;
  rxBytes: number;
  txBytes: number;
  timestamp: string;
}

export interface RangeUsageItem {
  appId: string;
  appName: string;
  rxBytes: number;
  txBytes: number;
  totalBytes: number;
  share: number;
  lastSeenAt: string;
}

export interface RangeUsageView {
  range: RangeKey;
  totalBytes: number;
  generatedAt: string;
  items: RangeUsageItem[];
}

export interface UsageQuery {
  range: RangeKey;
  search?: string;
  sortBy?: SortKey;
  limit?: number;
}

export interface AppSettings {
  locale: Locale;
  topN: number;
  viewMode: ViewMode;
  launchAtStartup: boolean;
  pollIntervalMs: number;
  persistIntervalMs: number;
  retentionDays: number;
}

export interface ProbeUsageItem {
  attributionId: string;
  rxBytes: number;
  txBytes: number;
}

export interface CollectorState {
  cursorIso?: string;
  lastUpdatedIso?: string;
  lastFlushIso?: string;
}

export interface CounterValue {
  appName: string;
  rxBytes: number;
  txBytes: number;
}

export interface CounterSnapshot {
  timestamp: string;
  counters: Record<string, CounterValue>;
}
