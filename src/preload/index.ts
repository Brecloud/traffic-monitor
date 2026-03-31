import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import type { AppSettings, RangeUsageView, UsageQuery } from "../shared/types";

const api = {
  getUsage: (query: UsageQuery): Promise<RangeUsageView> => ipcRenderer.invoke(IPC_CHANNELS.getUsage, query),
  refresh: (query: UsageQuery): Promise<RangeUsageView> => ipcRenderer.invoke(IPC_CHANNELS.refresh, query),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.getSettings),
  updateSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.updateSettings, settings),
  exportCsv: (query: UsageQuery): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.exportCsv, query),
  openDataDir: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.openDataDir),
  minimize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.windowMinimize),
  hide: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.windowHide),
  onDataUpdated: (listener: () => void): (() => void) => {
    const wrapped = () => listener();
    ipcRenderer.on(IPC_CHANNELS.dataUpdated, wrapped);
    return () => ipcRenderer.off(IPC_CHANNELS.dataUpdated, wrapped);
  }
};

contextBridge.exposeInMainWorld("trafficMonitor", api);
