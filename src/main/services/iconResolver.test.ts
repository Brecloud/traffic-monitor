import { describe, expect, it } from "vitest";
import { pickExistingPath, resolveIconAssets } from "./iconResolver";

describe("iconResolver", () => {
  it("returns first existing path", () => {
    const picked = pickExistingPath(["a", "b", "c"], (candidate) => candidate === "b");
    expect(picked).toBe("b");
  });

  it("returns null when no icon exists", () => {
    const assets = resolveIconAssets(
      {
        appPath: "C:/app",
        resourcesPath: "C:/resources",
        cwdPath: "C:/cwd"
      },
      () => false
    );

    expect(assets.trayIconPath).toBeNull();
    expect(assets.notificationIconPath).toBeNull();
  });

  it("resolves tray and notification icon paths", () => {
    const slashAgnostic = (value: string): string => value.replace(/\\/g, "/");
    const assets = resolveIconAssets(
      {
        appPath: "C:/app",
        resourcesPath: "C:/resources",
        cwdPath: "C:/cwd"
      },
      (candidate) =>
        slashAgnostic(candidate).endsWith("C:/cwd/build/icons/tray.png") ||
        slashAgnostic(candidate).endsWith("C:/resources/build/icons/icon.ico")
    );

    expect(assets.trayIconPath?.includes("tray.png")).toBe(true);
    expect(assets.notificationIconPath?.includes("icon.ico")).toBe(true);
  });
});
