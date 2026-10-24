# KidyCode V2 — Hermes crash recovery

The local Hermes Kanban board is `kidycode-v2`. This recovery automation is deliberately narrow. It never touches ALIA or any other board, never resets/cleans/merges code, and never pushes or deploys. It handles only tasks whose last history contains a crashed process and `gave_up` with `pid ... not alive`.

## Installation (run once in Windows PowerShell)

```powershell
$installer = Join-Path $env:TEMP 'install-kidycode-recovery.ps1'
Invoke-WebRequest 'https://raw.githubusercontent.com/A-Bimu/kidycode/main/scripts/install-kidycode-recovery.ps1' -OutFile $installer
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
```

The installer downloads the local recovery program to `%LOCALAPPDATA%\KidyCode\hermes-recovery\`, performs a dry-run, and registers a Windows Scheduled Task `KidyCode-Hermes-Recovery` to check every 10 minutes while the current user is signed in. It is designed to require no administrator privileges; Windows policies may still block registration.

## Rules

1. If any task is `running`, leave everything alone.
2. If a task is `blocked`, require both a `gave_up` worker-crash record and a `crashed` attempt. All other blocks stay blocked.
3. Require preserved `.worktrees/<taskId>` and the expected `wt/<taskId>` branch.
4. Back up `git diff --binary`, each untracked nonignored file, HEAD and status under `%LOCALAPPDATA%\KidyCode\hermes-recovery\snapshot-...`.
5. Record the single retry BEFORE unblocking, so a repeated execution or crash cannot trigger a paid retry loop.
6. `hermes kanban --board kidycode-v2 unblock <id>` and `dispatch --max 1` only once per task. Never touch production deployments.
7. Keep audit logs in `%LOCALAPPDATA%\KidyCode\hermes-recovery\recovery.log`.

Limitations: Requires Windows session signed in, working `hermes` and `git` on PATH, active Hermes gateway, internet/model credits, and a recoverable worktree. It does not repair broken code/test assertions, enforce the $20 OpenRouter budget, or guarantee completion. The original worker's `max-retries` / `failure_limit` may still block a restarted attempt. Check Hermes logs for noncrash failures. It does not update `main` or reconcile Day 1 and Day 2.

## Inspect

```powershell
Get-ScheduledTask -TaskName KidyCode-Hermes-Recovery
Get-Content "$env:LOCALAPPDATA\KidyCode\hermes-recovery\recovery.log" -Tail 25
hermes kanban --board kidycode-v2 list
```

## Stop

```powershell
Unregister-ScheduledTask -TaskName KidyCode-Hermes-Recovery -Confirm:$false
```

This disables future automated checks and preserves snapshots and logs.
