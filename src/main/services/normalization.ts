import type { ProbeUsageItem } from "../../shared/types";

const DEVICE_PREFIX_MAP: Record<string, string> = {
  "\\device\\harddiskvolume3\\": "C:\\",
  "\\device\\harddiskvolume4\\": "D:\\",
  "\\device\\harddiskvolume5\\": "E:\\"
};

function normalizeSlashes(input: string): string {
  return input.replace(/\//g, "\\");
}

export function normalizeAttributionId(raw: string | null | undefined): string {
  const value = normalizeSlashes((raw ?? "").trim());
  if (!value) {
    return "System/Unknown";
  }

  const lower = value.toLowerCase();
  for (const [prefix, drive] of Object.entries(DEVICE_PREFIX_MAP)) {
    if (lower.startsWith(prefix)) {
      return drive + value.slice(prefix.length).replace(/^\\+/, "");
    }
  }

  return value;
}

export function extractAppName(appId: string): string {
  const trimmed = appId.trim();
  if (!trimmed) {
    return "System/Unknown";
  }

  if (!trimmed.includes("\\") && !trimmed.includes("/")) {
    return trimmed;
  }

  const normalized = normalizeSlashes(trimmed);
  const chunks = normalized.split("\\").filter(Boolean);
  return chunks[chunks.length - 1] ?? "System/Unknown";
}

export function normalizeProbeItems(items: ProbeUsageItem[]): ProbeUsageItem[] {
  return items
    .map((item) => ({
      attributionId: normalizeAttributionId(item.attributionId),
      rxBytes: Number.isFinite(item.rxBytes) ? Math.max(0, Math.floor(item.rxBytes)) : 0,
      txBytes: Number.isFinite(item.txBytes) ? Math.max(0, Math.floor(item.txBytes)) : 0
    }))
    .filter((item) => item.rxBytes > 0 || item.txBytes > 0);
}
