import path from "node:path";
import fs from "node:fs/promises";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell
} from "electron";
import type { AppSettings, UsageQuery } from "../shared/types";
import { IPC_CHANNELS, DEFAULT_SETTINGS } from "../shared/constants";
import { t } from "../shared/i18n";
import { SampleRepository } from "./services/sampleRepository";
import { WindowsTrafficProbe } from "./services/windowsTrafficProbe";
import { CollectorService } from "./services/collectorService";
import { AggregationService } from "./services/aggregationService";
import { rangeUsageToCsv } from "./services/csvExport";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayMenuBuilder: (() => Menu) | null = null;
let isQuitting = false;

const dataDir = path.join(app.getPath("userData"), "traffic-monitor-data");
const repository = new SampleRepository(dataDir);
const probe = new WindowsTrafficProbe();
const collector = new CollectorService(probe, repository, {
  pollIntervalMs: DEFAULT_SETTINGS.pollIntervalMs,
  persistIntervalMs: DEFAULT_SETTINGS.persistIntervalMs,
  retentionDays: DEFAULT_SETTINGS.retentionDays
});
const aggregation = new AggregationService(repository, () => collector.getLiveSamples());

function getText(key: Parameters<typeof t>[1]): string {
  const locale = repository.getSettings().locale;
  return t(locale, key);
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 460,
    height: 720,
    minWidth: 360,
    minHeight: 420,
    frame: false,
    alwaysOnTop: true,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  return win;
}

function refreshTrayPresentation(): void {
  if (!tray || !trayMenuBuilder) {
    return;
  }

  tray.setToolTip(getText("tray.tooltip"));
  tray.setContextMenu(trayMenuBuilder());
}

function createTray(window: BrowserWindow): Tray {
  const icon = nativeImage
    .createFromDataURL(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAQklEQVR4AWP4z0AEMMDEwMDA+P//PwMDAwPjP4P///8ZGBhYwQxGKgNwGAsGg2A0GJgYGRiY6A9mBoYGBiYmBgYAAAG9cwV7n0ANKwAAAABJRU5ErkJggg=="
    )
    .resize({ width: 16, height: 16 });

  const trayInstance = new Tray(icon);

  const buildContextMenu = () =>
    Menu.buildFromTemplate([
      {
        label: window.isVisible() ? getText("tray.hideWidget") : getText("tray.showWidget"),
        click: () => {
          if (window.isVisible()) {
            window.hide();
          } else {
            window.show();
            window.focus();
          }
          refreshTrayPresentation();
        }
      },
      {
        label: getText("tray.refreshNow"),
        click: () => {
          void collector.collectNow();
        }
      },
      {
        label: getText("tray.openDataDir"),
        click: () => {
          void shell.openPath(dataDir);
        }
      },
      { type: "separator" },
      {
        label: getText("tray.quit"),
        click: () => {
          isQuitting = true;
          void collector.stop();
          app.quit();
        }
      }
    ]);

  trayMenuBuilder = buildContextMenu;

  trayInstance.on("click", () => {
    if (window.isVisible()) {
      window.hide();
    } else {
      window.show();
      window.focus();
    }
    refreshTrayPresentation();
  });

  trayInstance.on("right-click", () => {
    trayInstance.popUpContextMenu(buildContextMenu());
  });

  tray = trayInstance;
  refreshTrayPresentation();
  return trayInstance;
}

function notifyRendererDataUpdated(): void {
  mainWindow?.webContents.send(IPC_CHANNELS.dataUpdated, { at: new Date().toISOString() });
}

async function applyStartupSetting(settings: AppSettings): Promise<void> {
  if (process.platform === "win32") {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtStartup,
      path: process.execPath
    });
  }
}

function resolveQueryDefaults(query: UsageQuery): UsageQuery {
  const settings = repository.getSettings();
  return {
    ...query,
    limit: query.limit ?? settings.topN
  };
}

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getUsage, (_, query: UsageQuery) => {
    return aggregation.getUsage(resolveQueryDefaults(query));
  });

  ipcMain.handle(IPC_CHANNELS.refresh, async (_, query: UsageQuery) => {
    await collector.collectNow();
    return aggregation.getUsage(resolveQueryDefaults(query));
  });

  ipcMain.handle(IPC_CHANNELS.getSettings, async () => {
    return repository.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.updateSettings, async (_, next: Partial<AppSettings>) => {
    const saved = await repository.saveSettings(next);
    collector.updateOptions({
      pollIntervalMs: saved.pollIntervalMs,
      persistIntervalMs: saved.persistIntervalMs,
      retentionDays: saved.retentionDays
    });
    await applyStartupSetting(saved);
    refreshTrayPresentation();
    notifyRendererDataUpdated();
    return saved;
  });

  ipcMain.handle(IPC_CHANNELS.exportCsv, async (_, query: UsageQuery) => {
    const view = aggregation.getUsage(resolveQueryDefaults(query));
    const exportDir = path.join(dataDir, "exports");
    await fs.mkdir(exportDir, { recursive: true });
    const filename = `traffic-${query.range}-${Date.now()}.csv`;
    const output = path.join(exportDir, filename);
    await fs.writeFile(output, rangeUsageToCsv(view), "utf8");
    return output;
  });

  ipcMain.handle(IPC_CHANNELS.openDataDir, async () => {
    return shell.openPath(dataDir);
  });

  ipcMain.handle(IPC_CHANNELS.windowMinimize, () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.windowHide, () => {
    mainWindow?.hide();
    refreshTrayPresentation();
  });
}

async function bootstrap(): Promise<void> {
  if (process.platform !== "win32") {
    console.warn("Traffic Monitor currently supports Windows only.");
  }

  await repository.init();
  const stored = repository.getSettings();
  await repository.saveSettings({ ...DEFAULT_SETTINGS, ...stored });
  await applyStartupSetting(repository.getSettings());

  await collector.init();
  collector.on("collected", notifyRendererDataUpdated);
  collector.on("flushed", notifyRendererDataUpdated);
  collector.on("error", (error) => {
    console.error("collector error", error);
  });

  collector.startPolling();

  registerIpc();
  mainWindow = createWindow();
  createTray(mainWindow);
}

app.whenReady().then(() => {
  void bootstrap();
});

app.on("before-quit", () => {
  isQuitting = true;
  void collector.stop();
});

app.on("window-all-closed", () => {
  // Keep app alive in tray mode.
});

app.on("activate", () => {
  if (!mainWindow) {
    mainWindow = createWindow();
  }
  mainWindow.show();
  refreshTrayPresentation();
});

app.on("quit", () => {
  tray?.destroy();
});
