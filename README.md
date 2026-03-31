# Traffic Monitor

[中文](#中文说明) | [English](#english)

## 中文说明

Traffic Monitor 是一个 Windows 本地流量监控小组件，基于 Electron + React + TypeScript。

### 功能

- 每 10 秒采集一次应用流量，采用稳定统计口径（Windows attributed usage）。
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

### 下载与使用

- 普通用户请直接从 GitHub Releases 下载 zip，不需要进入源码目录。
- 解压后运行 `Traffic Monitor.exe` 即可。
- 当前发布形态为 Windows 便携版 zip。

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

详细流程见：[docs/release-workflow.md](docs/release-workflow.md)

### 系统兼容性

- 当前发布包面向 Windows 10 / Windows 11 64 位系统（x64）。
- 目前不提供 Windows 7 / 8 / 8.1 或 32 位版本支持。

### 下载入口

- [Releases 页面](https://github.com/Brecloud/traffic-monitor/releases)
- [最新版本](https://github.com/Brecloud/traffic-monitor/releases/latest)

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

### Download and Use

- End users should download the zip from GitHub Releases instead of browsing the source tree.
- Extract the archive and run `Traffic Monitor.exe`.
- The current distribution format is a Windows portable zip.

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

Detailed workflow: [docs/release-workflow.md](docs/release-workflow.md)

### Compatibility

- The current release targets Windows 10 / Windows 11 x64.
- Windows 7 / 8 / 8.1 and 32-bit builds are not supported at this time.

### Download Links

- [Releases page](https://github.com/Brecloud/traffic-monitor/releases)
- [Latest release](https://github.com/Brecloud/traffic-monitor/releases/latest)

## Data Locations

Runtime data (samples/settings/state/exports):
- `%APPDATA%/<app>/traffic-monitor-data`

Bootstrap snapshots:
- `data/bootstrap/today_network_usage_by_app.csv`
- `data/bootstrap/today_network_usage_by_app_human.csv`
- `data/bootstrap/today_network_usage_by_app_raw.csv`
- `data/bootstrap/today_network_usage_report.md`
