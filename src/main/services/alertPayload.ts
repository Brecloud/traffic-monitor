import type { AlertMessage } from "./alertEngine";

export interface AlertClickPayload {
  appName?: string;
}

export function buildAlertClickPayload(alert: AlertMessage): AlertClickPayload {
  if (!alert.appName || !alert.appName.trim()) {
    return {};
  }

  return { appName: alert.appName.trim() };
}
