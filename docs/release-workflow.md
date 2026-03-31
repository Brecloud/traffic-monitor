# Release Workflow

Traffic Monitor uses a lightweight release flow:

- `main` is the only long-lived branch.
- Daily work happens on short branches such as `feature/...` or `fix/...`.
- Source code goes into git.
- Windows packages go to GitHub Releases, not git history.

## Branch Naming

- `feature/v1.2-usage-breakdown`
- `fix/tray-icon`
- `release/v1.1.0`

## Commit Prefixes

- `feat:`
- `fix:`
- `docs:`
- `chore:`
- `release:`

## Daily Development

```bash
git switch main
git pull
git switch -c feature/short-description
```

- Keep work limited to source, docs, and scripts.
- Update `CHANGELOG.md` under `Unreleased` while you work.

## Release Preparation

1. Create a release branch from `main`.
2. Update `package.json` version.
3. Move the `Unreleased` section in `CHANGELOG.md` to the target version heading.
4. Run:

```bash
npm run release:check
```

## Publish

1. Merge the release branch into `main`.
2. Create and push a tag:

```bash
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

3. Create a GitHub Release for that tag.
4. Upload the zip from `release/`.
5. Reuse the changelog entry as the release notes.

## Keep The Repo Lean

- Do not commit `dist-renderer/`, `dist-electron/`, `release/`, `installed/`, or local archives.
- Keep local version archives such as `v1.0/` on disk only.
- If large assets are ever needed, prefer GitHub Releases or external storage.
