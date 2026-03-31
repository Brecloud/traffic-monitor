import type { Locale, RangeKey, SortKey } from "./types";

const zhCN = {
  "app.title": "流量监控",
  "app.subtitle": "Windows 本地流量小组件",
  "summary.total": "总流量",
  "summary.updated": "更新时间",
  "summary.topN": "Top N",
  "range.today": "今日",
  "range.yesterday": "昨日",
  "range.week": "本周",
  "range.month": "本月",
  "input.searchPlaceholder": "搜索应用",
  "sort.total": "排序：总量",
  "sort.download": "排序：下载",
  "sort.upload": "排序：上传",
  "action.refreshNow": "立即刷新",
  "action.exportCsv": "导出 CSV",
  "action.openDataDir": "打开数据目录",
  "action.switchToCompact": "切换紧凑视图",
  "action.switchToDetailed": "切换详细视图",
  "setting.launchAtStartup": "开机自启",
  "setting.alertsEnabled": "启用异常预警",
  "setting.dailyThresholdGb": "单应用日阈值(GB)",
  "setting.burstThresholdMb": "5分钟突增阈值(MB)",
  "setting.alertCooldownMinutes": "预警冷却(分钟)",
  "setting.alertThresholdHint": "说明：日阈值按单应用今日累计，突增阈值按近 5 分钟总增量，冷却用于避免重复提醒。",
  "setting.language": "语言",
  "setting.topN": "Top N",
  "locale.zh-CN": "中文",
  "locale.en-US": "English",
  "state.loading": "正在刷新流量数据...",
  "state.empty": "当前时间范围暂无流量记录。",
  "notice.exported": "已导出：{{path}}",
  "notice.alertFocused": "已根据预警定位到应用：{{app}}",
  "notice.alertFocusedFallback": "已根据预警切换到今日视图。",
  "alert.title": "流量异常预警",
  "alert.dailyExceeded": "{{app}} 今日流量已达 {{value}}，超过阈值 {{threshold}}。",
  "alert.burstExceeded": "近 5 分钟流量激增 {{value}}，超过阈值 {{threshold}}。",
  "table.app": "应用",
  "table.total": "总量",
  "table.download": "下载",
  "table.upload": "上传",
  "table.share": "占比",
  "tray.tooltip": "流量监控",
  "tray.showWidget": "显示窗口",
  "tray.hideWidget": "隐藏窗口",
  "tray.refreshNow": "立即刷新",
  "tray.openDataDir": "打开数据目录",
  "tray.quit": "退出"
} as const;

type TranslationKey = keyof typeof zhCN;

const enUS: Record<TranslationKey, string> = {
  "app.title": "Traffic Monitor",
  "app.subtitle": "Windows local traffic widget",
  "summary.total": "Total",
  "summary.updated": "Updated",
  "summary.topN": "Top N",
  "range.today": "Today",
  "range.yesterday": "Yesterday",
  "range.week": "Week",
  "range.month": "Month",
  "input.searchPlaceholder": "Search app",
  "sort.total": "Sort: Total",
  "sort.download": "Sort: Download",
  "sort.upload": "Sort: Upload",
  "action.refreshNow": "Refresh now",
  "action.exportCsv": "Export CSV",
  "action.openDataDir": "Open data dir",
  "action.switchToCompact": "Switch to compact",
  "action.switchToDetailed": "Switch to detailed",
  "setting.launchAtStartup": "Launch at startup",
  "setting.alertsEnabled": "Enable anomaly alerts",
  "setting.dailyThresholdGb": "Per-app daily threshold (GB)",
  "setting.burstThresholdMb": "5-minute burst threshold (MB)",
  "setting.alertCooldownMinutes": "Alert cooldown (minutes)",
  "setting.alertThresholdHint":
    "Tip: Daily threshold is per app total for today, burst threshold is total growth in the last 5 minutes, and cooldown avoids duplicate alerts.",
  "setting.language": "Language",
  "setting.topN": "Top N",
  "locale.zh-CN": "Chinese",
  "locale.en-US": "English",
  "state.loading": "Refreshing usage data...",
  "state.empty": "No usage records for this range.",
  "notice.exported": "Exported: {{path}}",
  "notice.alertFocused": "Focused on alerted app: {{app}}",
  "notice.alertFocusedFallback": "Switched to Today view from alert.",
  "alert.title": "Traffic anomaly alert",
  "alert.dailyExceeded": "{{app}} has reached {{value}} today, above threshold {{threshold}}.",
  "alert.burstExceeded": "Traffic spiked by {{value}} in the last 5 minutes, above threshold {{threshold}}.",
  "table.app": "App",
  "table.total": "Total",
  "table.download": "Download",
  "table.upload": "Upload",
  "table.share": "Share",
  "tray.tooltip": "Traffic Monitor",
  "tray.showWidget": "Show widget",
  "tray.hideWidget": "Hide widget",
  "tray.refreshNow": "Refresh now",
  "tray.openDataDir": "Open data directory",
  "tray.quit": "Quit"
};

export type I18nKey = TranslationKey;

const dictionaries: Record<Locale, Record<I18nKey, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS
};

export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en-US"];

const RANGE_KEY_MAP: Record<RangeKey, I18nKey> = {
  today: "range.today",
  yesterday: "range.yesterday",
  week: "range.week",
  month: "range.month"
};

const SORT_KEY_MAP: Record<SortKey, I18nKey> = {
  total: "sort.total",
  download: "sort.download",
  upload: "sort.upload"
};

export function getDictionaries(): Record<Locale, Record<I18nKey, string>> {
  return dictionaries;
}

export function t(locale: Locale, key: I18nKey, vars?: Record<string, string>): string {
  const table = dictionaries[locale] ?? dictionaries["en-US"];
  const source = table[key] ?? dictionaries["en-US"][key] ?? key;
  if (!vars) {
    return source;
  }

  return Object.entries(vars).reduce((acc, [name, value]) => {
    return acc.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), value);
  }, source);
}

export function getRangeLabel(locale: Locale, range: RangeKey): string {
  return t(locale, RANGE_KEY_MAP[range]);
}

export function getSortLabel(locale: Locale, sortBy: SortKey): string {
  return t(locale, SORT_KEY_MAP[sortBy]);
}
