import { describe, expect, it } from "vitest";
import { extractAppName, normalizeAttributionId, normalizeProbeItems } from "./normalization";

describe("normalization", () => {
  it("maps known harddisk volumes to drive letters", () => {
    expect(normalizeAttributionId("\\device\\harddiskvolume3\\Program Files\\App\\app.exe")).toBe(
      "C:\\Program Files\\App\\app.exe"
    );
    expect(normalizeAttributionId("\\device\\harddiskvolume4\\tools\\tool.exe")).toBe(
      "D:\\tools\\tool.exe"
    );
  });

  it("handles blank attribution", () => {
    expect(normalizeAttributionId("  ")).toBe("System/Unknown");
  });

  it("extracts application name from path and package", () => {
    expect(extractAppName("C:\\Program Files\\Google\\Chrome\\chrome.exe")).toBe("chrome.exe");
    expect(extractAppName("Microsoft.WindowsStore_8wekyb3d8bbwe")).toBe("Microsoft.WindowsStore_8wekyb3d8bbwe");
  });

  it("normalizes probe bytes and drops non-positive entries", () => {
    const output = normalizeProbeItems([
      { attributionId: "", rxBytes: 0, txBytes: 0 },
      { attributionId: "A", rxBytes: 12.9, txBytes: -2 },
      { attributionId: "B", rxBytes: Number.NaN, txBytes: 4 }
    ]);

    expect(output).toEqual([
      { attributionId: "A", rxBytes: 12, txBytes: 0 },
      { attributionId: "B", rxBytes: 0, txBytes: 4 }
    ]);
  });
});
