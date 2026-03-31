import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSettings, Locale, RangeKey, RangeUsageView, SortKey, UsageQuery } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/constants";
import { formatBytes } from "../shared/formatBytes";
import { SUPPORTED_LOCALES, getRangeLabel, getSortLabel, t } from "../shared/i18n";
import { UsageTable } from "./components/UsageTable";

const RANGE_OPTIONS: RangeKey[] = ["today", "yesterday", "week", "month"];
const SORT_OPTIONS: SortKey[] = ["total", "download", "upload"];

export function App(): JSX.Element {
  const [range, setRange] = useState<RangeKey>("today");
  const [sortBy, setSortBy] = useState<SortKey>("total");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<RangeUsageView>({
    range: "today",
    totalBytes: 0,
    generatedAt: new Date().toISOString(),
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const locale = settings.locale;

  const tr = useCallback(
    (key: Parameters<typeof t>[1], vars?: Record<string, string>) => t(locale, key, vars),
    [locale]
  );

  const query = useMemo<UsageQuery>(
    () => ({
      range,
      search,
      sortBy,
      limit: settings.topN
    }),
    [range, search, sortBy, settings.topN]
  );

  const loadUsage = useCallback(async (nextQuery: UsageQuery) => {
    setLoading(true);
    try {
      const response = await window.trafficMonitor.getUsage(nextQuery);
      setView(response);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      const nextSettings = await window.trafficMonitor.getSettings();
      setSettings(nextSettings);
      await loadUsage({ ...query, limit: nextSettings.topN });
    };

    void init();
  }, []);

  useEffect(() => {
    void loadUsage(query);
  }, [query, loadUsage]);

  useEffect(() => {
    const unsubscribe = window.trafficMonitor.onDataUpdated(() => {
      void loadUsage(query);
    });
    return unsubscribe;
  }, [loadUsage, query]);

  useEffect(() => {
    const unsubscribe = window.trafficMonitor.onAlertClicked((payload) => {
      const appName = payload.appName?.trim();
      setRange("today");
      if (appName) {
        setSearch(appName);
        setMessage(tr("notice.alertFocused", { app: appName }));
      } else {
        setMessage(tr("notice.alertFocusedFallback"));
      }
      setTimeout(() => setMessage(""), 4500);
    });
    return unsubscribe;
  }, [tr]);

  const onToggleMode = async (): Promise<void> => {
    const nextMode = settings.viewMode === "detailed" ? "compact" : "detailed";
    const updated = await window.trafficMonitor.updateSettings({ viewMode: nextMode });
    setSettings(updated);
  };

  const onToggleStartup = async (): Promise<void> => {
    const updated = await window.trafficMonitor.updateSettings({
      launchAtStartup: !settings.launchAtStartup
    });
    setSettings(updated);
  };

  const onTopNChange = async (value: number): Promise<void> => {
    const safe = Math.max(3, Math.min(30, Math.round(value)));
    const updated = await window.trafficMonitor.updateSettings({ topN: safe });
    setSettings(updated);
  };

  const onAlertSwitch = async (): Promise<void> => {
    const updated = await window.trafficMonitor.updateSettings({
      alertsEnabled: !settings.alertsEnabled
    });
    setSettings(updated);
  };

  const onAlertNumberChange = async (
    key: "dailyThresholdGb" | "burstThresholdMb" | "alertCooldownMinutes",
    value: number
  ): Promise<void> => {
    if (!Number.isFinite(value)) {
      return;
    }
    const safe = Math.max(1, Math.round(value * 100) / 100);
    const updated = await window.trafficMonitor.updateSettings({ [key]: safe });
    setSettings(updated);
  };

  const onLocaleChange = async (nextLocale: Locale): Promise<void> => {
    const updated = await window.trafficMonitor.updateSettings({ locale: nextLocale });
    setSettings(updated);
  };

  const onExport = async (): Promise<void> => {
    const target = await window.trafficMonitor.exportCsv(query);
    setMessage(tr("notice.exported", { path: target }));
    setTimeout(() => setMessage(""), 4500);
  };

  const onRefreshNow = async (): Promise<void> => {
    const latest = await window.trafficMonitor.refresh(query);
    setView(latest);
  };

  return (
    <div className="shell">
      <div className="titlebar">
        <div className="title-wrap">
          <div className="title">{tr("app.title")}</div>
          <div className="subtitle">{tr("app.subtitle")}</div>
        </div>
        <div className="title-actions no-drag">
          <button onClick={() => void window.trafficMonitor.minimize()}>_</button>
          <button onClick={() => void window.trafficMonitor.hide()}>X</button>
        </div>
      </div>

      <section className="summary-card">
        <div className="summary-item">
          <span>{tr("summary.total")}</span>
          <strong>{formatBytes(view.totalBytes)}</strong>
        </div>
        <div className="summary-item">
          <span>{tr("summary.updated")}</span>
          <strong>{new Date(view.generatedAt).toLocaleTimeString(locale)}</strong>
        </div>
        <div className="summary-item">
          <span>{tr("summary.topN")}</span>
          <strong>{settings.topN}</strong>
        </div>
      </section>

      <section className="controls no-drag">
        <div className="range-tabs">
          {RANGE_OPTIONS.map((item) => (
            <button
              key={item}
              className={item === range ? "active" : ""}
              onClick={() => setRange(item)}
            >
              {getRangeLabel(locale, item)}
            </button>
          ))}
        </div>

        <div className="row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tr("input.searchPlaceholder")}
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {getSortLabel(locale, option)}
              </option>
            ))}
          </select>
        </div>

        <div className="row actions">
          <button onClick={() => void onRefreshNow()}>{tr("action.refreshNow")}</button>
          <button onClick={() => void onExport()}>{tr("action.exportCsv")}</button>
          <button onClick={() => void window.trafficMonitor.openDataDir()}>{tr("action.openDataDir")}</button>
          <button onClick={() => void onToggleMode()}>
            {settings.viewMode === "detailed"
              ? tr("action.switchToCompact")
              : tr("action.switchToDetailed")}
          </button>
        </div>

        <div className="row settings-row">
          <label>
            <input
              type="checkbox"
              checked={settings.launchAtStartup}
              onChange={() => void onToggleStartup()}
            />
            {tr("setting.launchAtStartup")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.alertsEnabled}
              onChange={() => void onAlertSwitch()}
            />
            {tr("setting.alertsEnabled")}
          </label>
          <label>
            {tr("setting.language")}
            <select value={locale} onChange={(event) => void onLocaleChange(event.target.value as Locale)}>
              {SUPPORTED_LOCALES.map((item) => (
                <option key={item} value={item}>
                  {tr(item === "zh-CN" ? "locale.zh-CN" : "locale.en-US")}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr("setting.topN")}
            <input
              className="topn"
              type="number"
              min={3}
              max={30}
              value={settings.topN}
              onChange={(event) => void onTopNChange(Number(event.target.value || "8"))}
            />
          </label>
        </div>

        <div className="row settings-row">
          <label>
            {tr("setting.dailyThresholdGb")}
            <input
              className="topn"
              type="number"
              min={1}
              value={settings.dailyThresholdGb}
              onChange={(event) => void onAlertNumberChange("dailyThresholdGb", Number(event.target.value || "2"))}
            />
          </label>
          <label>
            {tr("setting.burstThresholdMb")}
            <input
              className="topn"
              type="number"
              min={1}
              value={settings.burstThresholdMb}
              onChange={(event) => void onAlertNumberChange("burstThresholdMb", Number(event.target.value || "300"))}
            />
          </label>
          <label>
            {tr("setting.alertCooldownMinutes")}
            <input
              className="topn"
              type="number"
              min={1}
              value={settings.alertCooldownMinutes}
              onChange={(event) =>
                void onAlertNumberChange("alertCooldownMinutes", Number(event.target.value || "15"))
              }
            />
          </label>
        </div>
        <div className="settings-hint">{tr("setting.alertThresholdHint")}</div>
      </section>

      {loading ? <div className="loading">{tr("state.loading")}</div> : null}
      {message ? <div className="notice">{message}</div> : null}

      <UsageTable locale={locale} items={view.items} mode={settings.viewMode} />
    </div>
  );
}
