import { describe, expect, it } from "vitest";
import { getRangeBounds } from "./timeRange";

describe("timeRange (Asia/Singapore)", () => {
  const now = new Date("2026-03-30T04:00:00.000Z"); // 2026-03-30 12:00:00 +08

  it("builds today and yesterday bounds", () => {
    const today = getRangeBounds("today", now);
    const yesterday = getRangeBounds("yesterday", now);

    expect(today.start.toISOString()).toBe("2026-03-29T16:00:00.000Z");
    expect(yesterday.start.toISOString()).toBe("2026-03-28T16:00:00.000Z");
    expect(yesterday.end.toISOString()).toBe("2026-03-29T16:00:00.000Z");
  });

  it("uses Monday as week start", () => {
    const week = getRangeBounds("week", now);
    expect(week.start.toISOString()).toBe("2026-03-29T16:00:00.000Z");
  });

  it("uses calendar month start", () => {
    const month = getRangeBounds("month", now);
    expect(month.start.toISOString()).toBe("2026-02-28T16:00:00.000Z");
  });
});
