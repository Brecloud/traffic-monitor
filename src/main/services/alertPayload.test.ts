import { describe, expect, it } from "vitest";
import { buildAlertClickPayload } from "./alertPayload";

describe("buildAlertClickPayload", () => {
  it("includes appName for valid alert context", () => {
    const payload = buildAlertClickPayload({
      type: "daily",
      body: "x",
      appName: "chrome.exe"
    });

    expect(payload).toEqual({ appName: "chrome.exe" });
  });

  it("returns empty payload when appName is missing", () => {
    const payload = buildAlertClickPayload({
      type: "burst",
      body: "x"
    });

    expect(payload).toEqual({});
  });
});
