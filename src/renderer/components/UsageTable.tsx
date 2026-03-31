import { formatBytes } from "../../shared/formatBytes";
import { t } from "../../shared/i18n";
import type { Locale, RangeUsageItem, ViewMode } from "../../shared/types";

interface UsageTableProps {
  locale: Locale;
  items: RangeUsageItem[];
  mode: ViewMode;
}

export function UsageTable({ locale, items, mode }: UsageTableProps): JSX.Element {
  if (items.length === 0) {
    return <div className="empty-state">{t(locale, "state.empty")}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="usage-table">
        <thead>
          <tr>
            <th>{t(locale, "table.app")}</th>
            <th>{t(locale, "table.total")}</th>
            {mode === "detailed" ? <th>{t(locale, "table.download")}</th> : null}
            {mode === "detailed" ? <th>{t(locale, "table.upload")}</th> : null}
            {mode === "detailed" ? <th>{t(locale, "table.share")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.appId}>
              <td>
                <div className="app-name">{item.appName}</div>
                {mode === "detailed" ? <div className="app-id">{item.appId}</div> : null}
              </td>
              <td>{formatBytes(item.totalBytes)}</td>
              {mode === "detailed" ? <td>{formatBytes(item.rxBytes)}</td> : null}
              {mode === "detailed" ? <td>{formatBytes(item.txBytes)}</td> : null}
              {mode === "detailed" ? <td>{(item.share * 100).toFixed(1)}%</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
