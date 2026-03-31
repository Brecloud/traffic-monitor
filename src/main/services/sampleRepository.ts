import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import type { AppSettings, AppUsageRecord, CollectorState } from "../../shared/types";

interface RepositoryFiles {
  samplesFile: string;
  stateFile: string;
  settingsFile: string;
}

export class SampleRepository {
  private readonly files: RepositoryFiles;
  private readonly baseDir: string;
  private samples: AppUsageRecord[] = [];
  private state: CollectorState = {};
  private settings: AppSettings = DEFAULT_SETTINGS;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.files = {
      samplesFile: path.join(baseDir, "samples.jsonl"),
      stateFile: path.join(baseDir, "state.json"),
      settingsFile: path.join(baseDir, "settings.json")
    };
  }

  getDataDir(): string {
    return this.baseDir;
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  getState(): CollectorState {
    return this.state;
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });

    const [samplesRaw, stateRaw, settingsRaw] = await Promise.all([
      this.readFileOrDefault(this.files.samplesFile, ""),
      this.readFileOrDefault(this.files.stateFile, "{}"),
      this.readFileOrDefault(this.files.settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    ]);

    this.samples = samplesRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AppUsageRecord);

    this.state = JSON.parse(stateRaw) as CollectorState;

    const parsedSettings = JSON.parse(settingsRaw) as Partial<AppSettings>;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...parsedSettings
    };

    await this.persistSettings(this.settings);
    await this.persistState(this.state);
  }

  async appendSamples(records: AppUsageRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    this.samples.push(...records);
    const payload = records.map((record) => JSON.stringify(record)).join("\n") + "\n";
    await fs.appendFile(this.files.samplesFile, payload, "utf8");
  }

  getSamplesBetween(start: Date, end: Date): AppUsageRecord[] {
    const startMs = start.getTime();
    const endMs = end.getTime();
    return this.samples.filter((record) => {
      const ts = new Date(record.timestamp).getTime();
      return ts >= startMs && ts < endMs;
    });
  }

  async pruneOlderThan(cutoff: Date): Promise<void> {
    const cutoffMs = cutoff.getTime();
    const pruned = this.samples.filter((record) => new Date(record.timestamp).getTime() >= cutoffMs);

    if (pruned.length === this.samples.length) {
      return;
    }

    this.samples = pruned;
    const payload = pruned.map((record) => JSON.stringify(record)).join("\n");
    await fs.writeFile(this.files.samplesFile, payload.length > 0 ? `${payload}\n` : "", "utf8");
  }

  async updateState(partial: CollectorState): Promise<CollectorState> {
    this.state = {
      ...this.state,
      ...partial
    };
    await this.persistState(this.state);
    return this.state;
  }

  async saveSettings(input: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = {
      ...this.settings,
      ...input
    };
    await this.persistSettings(this.settings);
    return this.settings;
  }

  private async persistState(state: CollectorState): Promise<void> {
    await fs.writeFile(this.files.stateFile, JSON.stringify(state, null, 2), "utf8");
  }

  private async persistSettings(settings: AppSettings): Promise<void> {
    await fs.writeFile(this.files.settingsFile, JSON.stringify(settings, null, 2), "utf8");
  }

  private async readFileOrDefault(filePath: string, fallback: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      await fs.writeFile(filePath, fallback, "utf8");
      return fallback;
    }
  }
}
