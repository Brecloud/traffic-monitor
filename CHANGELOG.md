# Changelog

## Unreleased

- No unreleased changes yet.

## v1.1.0 - 2026-03-31

- Added anomaly alert engine with two rules:
  - per-app daily threshold
  - 5-minute burst threshold
- Added alert cooldown to avoid repeated spam notifications.
- Added UI settings for alert switch and thresholds.
- Added bilingual alert copy and tray-localized alert title.
- Added unified icon assets for tray/notification/packaging consistency.
- Added Windows notification click-to-focus behavior and app targeting in UI.
- Added threshold hint text in settings (no mute/silent mode introduced).
- Added unit tests for alert behavior and cooldown.

## v1.0.0 - 2026-03-31

- Added full Chinese and English UI switch with persisted locale setting (`zh-CN` default).
- Localized tray menu and dynamic tray tooltip updates after language change.
- Kept existing monitoring capabilities for today/yesterday/week/month usage views.
- Added Windows zip packaging workflow for release distribution.
- Prepared first stable release metadata and GitHub release flow.
