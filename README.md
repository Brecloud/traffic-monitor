# Traffic Monitor

## 中文说明

Traffic Monitor 是一个 Windows 本地流量监控小组件，基于 Electron + React + TypeScript。

### 功能

- 每 10 秒采集一次应用流量（稳定统计口径，Windows attributed usage）。
- 每分钟本地持久化（JSONL），支持历史聚合。
- 支持四个时间维度：今日、昨日、本周（周一开始）、本月。
- Top-N 应用列表，支持搜索和排序（总量/下载/上传）。
- 托盘常驻：显示/隐藏、立即刷新、打开数据目录、退出。
- 当前视图一键导出 CSV。
- 中英文界面切换（默认中文），设置持久化。

### 快速启动

```bash
npm install
npm run dev
```

### 测试与构建

```bash
npm run test
npm run build
```

### Windows 便携包

```bash
npm run package:win
```

打包输出目录：`release/`

### 版本发布与仓库管理

- 仓库只保留源码、文档和脚本。
- Windows 安装包通过 GitHub Releases 分发。
- 不提交 `dist-*`、`release/`、`installed/`、本地版本归档。
- 使用 `main` + 短分支，例如 `feature/...`、`fix/...`、`release/...`。
- 开发中的发布说明统一写在 `CHANGELOG.md` 的 `Unreleased`。

发布前检查：

```bash
npm run release:check
```

详细流程见：`docs/release-workflow.md`

---

## English

Traffic Monitor is a local Windows traffic monitor widget built with Electron + React + TypeScript.

### Features

- Polls app traffic every 10 seconds using Windows attributed usage APIs.
- Persists usage samples every minute (JSONL) for historical aggregation.
- Usage views: today, yesterday, week (Monday start), and month.
- Top-N app list with search and sorting (total/download/upload).
- Tray controls: show/hide widget, refresh now, open data directory, quit.
- One-click CSV export for the current view.
- Chinese/English UI switch with persisted locale (default: Chinese).

### Quick Start

```bash
npm install
npm run dev
```

### Test and Build

```bash
npm run test
npm run build
```

### Windows Portable Package

```bash
npm run package:win
```

Package output directory: `release/`

### Release and Repo Hygiene

- Keep the repo for source code, docs, and scripts.
- Publish Windows packages through GitHub Releases.
- Do not commit `dist-*`, `release/`, `installed/`, or local version archives.
- Use `main` plus short-lived branches such as `feature/...`, `fix/...`, and `release/...`.
- Track upcoming release notes in the `Unreleased` section of `CHANGELOG.md`.

Release preflight:

```bash
npm run release:check
```

Detailed workflow: `docs/release-workflow.md`

## Data Locations

Runtime data (samples/settings/state/exports):
- `%APPDATA%/<app>/traffic-monitor-data`

Bootstrap snapshots:
- `data/bootstrap/today_network_usage_by_app.csv`
- `data/bootstrap/today_network_usage_by_app_human.csv`
- `data/bootstrap/today_network_usage_by_app_raw.csv`
- `data/bootstrap/today_network_usage_report.md`
