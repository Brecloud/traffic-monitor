import type { AppSettings, RangeUsageView, UsageQuery } from "../shared/types";

declare global {
  interface Window {
    trafficMonitor: {
      getUsage(query: UsageQuery): Promise<RangeUsageView>;
      refresh(query: UsageQuery): Promise<RangeUsageView>;
      getSettings(): Promise<AppSettings>;
      updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
      exportCsv(query: UsageQuery): Promise<string>;
      openDataDir(): Promise<string>;
      minimize(): Promise<void>;
      hide(): Promise<void>;
      onDataUpdated(listener: () => void): () => void;
      onAlertClicked(listener: (payload: { appName?: string }) => void): () => void;
    };
  }
}

export {};
