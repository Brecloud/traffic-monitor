import { spawn } from "node:child_process";
import type { ProbeUsageItem } from "../../shared/types";
import { getWindowsProbeScript } from "./probeScript";

function safeParsePayload(payload: string): ProbeUsageItem[] {
  const trimmed = payload.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed) as unknown;
  const arr = Array.isArray(parsed) ? parsed : [parsed];

  return arr
    .map((entry) => {
      const value = entry as Record<string, unknown>;
      return {
        attributionId: String(value.attributionId ?? "System/Unknown"),
        rxBytes: Number(value.rxBytes ?? 0),
        txBytes: Number(value.txBytes ?? 0)
      } as ProbeUsageItem;
    })
    .filter((item) => Number.isFinite(item.rxBytes) && Number.isFinite(item.txBytes));
}

export class WindowsTrafficProbe {
  async collectInterval(start: Date, end: Date): Promise<ProbeUsageItem[]> {
    if (process.platform !== "win32") {
      return [];
    }

    return new Promise<ProbeUsageItem[]>((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "-"],
        {
          env: {
            ...process.env,
            TM_START: start.toISOString(),
            TM_END: end.toISOString()
          },
          stdio: ["pipe", "pipe", "pipe"]
        }
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      child.on("error", reject);

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`PowerShell probe failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          resolve(safeParsePayload(stdout));
        } catch (error) {
          reject(new Error(`Probe JSON parse failed: ${(error as Error).message}`));
        }
      });

      child.stdin.write(getWindowsProbeScript());
      child.stdin.end();
    });
  }
}
