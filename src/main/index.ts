import path from "node:path";
import fs from "node:fs/promises";
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  shell,
  Notification
} from "electron";
import type { AppSettings, UsageQuery } from "../shared/types";
import { IPC_CHANNELS, DEFAULT_SETTINGS } from "../shared/constants";
import { t } from "../shared/i18n";
import { SampleRepository } from "./services/sampleRepository";
import { WindowsTrafficProbe } from "./services/windowsTrafficProbe";
import { CollectorService } from "./services/collectorService";
import { AggregationService } from "./services/aggregationService";
import { AlertEngine } from "./services/alertEngine";
import { rangeUsageToCsv } from "./services/csvExport";
import { resolveIconAssets, type IconAssets } from "./services/iconResolver";
import { buildAlertClickPayload } from "./services/alertPayload";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayMenuBuilder: (() => Menu) | null = null;
let isQuitting = false;
let iconAssets: IconAssets | null = null;

const dataDir = path.join(app.getPath("userData"), "traffic-monitor-data");
const repository = new SampleRepository(dataDir);
const probe = new WindowsTrafficProbe();
const collector = new CollectorService(probe, repository, {
  pollIntervalMs: DEFAULT_SETTINGS.pollIntervalMs,
  persistIntervalMs: DEFAULT_SETTINGS.persistIntervalMs,
  retentionDays: DEFAULT_SETTINGS.retentionDays
});
const aggregation = new AggregationService(repository, () => collector.getLiveSamples());
const alertEngine = new AlertEngine();

if (process.platform === "win32") {
  app.setAppUserModelId("com.brecloud.trafficmonitor");
}

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

function createTray(window: BrowserWindow): Tray | null {
  const trayIconPath = iconAssets?.trayIconPath ?? iconAssets?.notificationIconPath ?? "";
  const icon = nativeImage.createFromPath(trayIconPath);
  if (icon.isEmpty()) {
    console.warn("Tray icon is missing. Running without tray icon.");
    return null;
  }
  const trayImage = icon.resize({ width: 16, height: 16 });

  const trayInstance = new Tray(trayImage);

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

function handleAlerts(atIso: string, deltas: Array<{ appId: string; appName: string; rxBytes: number; txBytes: number; timestamp: string }>): void {
  const settings = repository.getSettings();
  if (!settings.alertsEnabled) {
    return;
  }

  const todayView = aggregation.getUsage({ range: "today", sortBy: "total", limit: 9999 });
  const alerts = alertEngine.evaluate({
    atIso,
    locale: settings.locale,
    settings,
    todayView,
    deltas
  });

  for (const alert of alerts) {
    const notification = new Notification({
      title: getText("alert.title"),
      body: alert.body,
      icon: iconAssets?.notificationIconPath ?? undefined
    });

    notification.on("click", () => {
      if (!mainWindow) {
        return;
      }
      mainWindow.show();
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      mainWindow.webContents.send(IPC_CHANNELS.alertClicked, buildAlertClickPayload(alert));
    });

    notification.show();
  }
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
  iconAssets = resolveIconAssets({
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    cwdPath: process.cwd()
  });
  const stored = repository.getSettings();
  await repository.saveSettings({ ...DEFAULT_SETTINGS, ...stored });
  await applyStartupSetting(repository.getSettings());

  await collector.init();
  collector.on("collected", (payload: { at: string; deltas?: Array<{ appId: string; appName: string; rxBytes: number; txBytes: number; timestamp: string }> }) => {
    if (payload?.deltas && payload.deltas.length > 0) {
      handleAlerts(payload.at, payload.deltas);
    }
    notifyRendererDataUpdated();
  });
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
