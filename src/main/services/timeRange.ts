import type { RangeKey } from "../../shared/types";

const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

function toSgtDate(date: Date): Date {
  return new Date(date.getTime() + SGT_OFFSET_MS);
}

function fromSgtParts(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - SGT_OFFSET_MS);
}

function startOfSgtDay(date: Date): Date {
  const sgt = toSgtDate(date);
  return fromSgtParts(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function startOfSgtWeek(date: Date): Date {
  const sgt = toSgtDate(date);
  const weekday = sgt.getUTCDay();
  const daysFromMonday = (weekday + 6) % 7;
  const dayStart = startOfSgtDay(date);
  return addDays(dayStart, -daysFromMonday);
}

function startOfSgtMonth(date: Date): Date {
  const sgt = toSgtDate(date);
  return fromSgtParts(sgt.getUTCFullYear(), sgt.getUTCMonth(), 1);
}

export function getRangeBounds(range: RangeKey, now: Date = new Date()): { start: Date; end: Date } {
  const end = now;
  const todayStart = startOfSgtDay(now);

  if (range === "today") {
    return { start: todayStart, end };
  }

  if (range === "yesterday") {
    return { start: addDays(todayStart, -1), end: todayStart };
  }

  if (range === "week") {
    return { start: startOfSgtWeek(now), end };
  }

  return { start: startOfSgtMonth(now), end };
}

export function isInRange(targetIso: string, start: Date, end: Date): boolean {
  const timestamp = new Date(targetIso).getTime();
  return timestamp >= start.getTime() && timestamp < end.getTime();
}
