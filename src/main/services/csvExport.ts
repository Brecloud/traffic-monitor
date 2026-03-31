import { formatBytes } from "../../shared/formatBytes";
import type { RangeUsageView } from "../../shared/types";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rangeUsageToCsv(view: RangeUsageView): string {
  const rows = [
    ["App", "Total", "Download", "Upload", "Share(%)", "LastSeenAt"],
    ...view.items.map((item) => [
      item.appName,
      formatBytes(item.totalBytes),
      formatBytes(item.rxBytes),
      formatBytes(item.txBytes),
      (item.share * 100).toFixed(2),
      item.lastSeenAt
    ])
  ];

  return rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\n");
}
