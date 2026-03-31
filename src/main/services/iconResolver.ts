import { existsSync } from "node:fs";
import path from "node:path";

export interface IconAssets {
  trayIconPath: string | null;
  notificationIconPath: string | null;
  packageIconPath: string | null;
}

export function pickExistingPath(
  candidates: string[],
  exists: (candidate: string) => boolean = existsSync
): string | null {
  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function uniqueList(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function iconCandidates(fileName: string, appPath: string, resourcesPath: string, cwdPath: string): string[] {
  return uniqueList([
    path.join(appPath, "build", "icons", fileName),
    path.join(resourcesPath, "build", "icons", fileName),
    path.join(cwdPath, "build", "icons", fileName)
  ]);
}

export function resolveIconAssets(
  input: { appPath: string; resourcesPath: string; cwdPath: string },
  exists: (candidate: string) => boolean = existsSync
): IconAssets {
  const trayIconPath = pickExistingPath(
    iconCandidates("tray.png", input.appPath, input.resourcesPath, input.cwdPath),
    exists
  );

  const packageIconPath = pickExistingPath(
    iconCandidates("icon.ico", input.appPath, input.resourcesPath, input.cwdPath),
    exists
  );

  return {
    trayIconPath,
    notificationIconPath: packageIconPath ?? trayIconPath,
    packageIconPath
  };
}
