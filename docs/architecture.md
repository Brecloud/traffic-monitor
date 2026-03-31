# Architecture (V1)

## Pipeline

1. `CollectorService` polls every 10s.
2. `WindowsTrafficProbe` queries Windows attributed network usage for `[cursor, now]`.
3. Deltas are buffered in-memory by app.
4. Every 60s, buffered deltas are persisted to `samples.jsonl`.
5. `AggregationService` reads persisted + live buffer to build period views.

## Storage

- `samples.jsonl`: minute-level app usage samples (`rxBytes`, `txBytes`, `timestamp`).
- `state.json`: cursor and last flush metadata.
- `settings.json`: UI and collection settings.
- `exports/*.csv`: user-triggered exports.

## Range semantics

- Timezone: `Asia/Singapore`.
- `today`: 00:00 SGT to now.
- `yesterday`: previous day 00:00-24:00 SGT.
- `week`: Monday 00:00 SGT to now.
- `month`: first day 00:00 SGT to now.

## IPC surface

- `traffic:get-usage`
- `traffic:refresh`
- `traffic:get-settings`
- `traffic:update-settings`
- `traffic:export-csv`
- `traffic:open-data-dir`
- `traffic:data-updated`
