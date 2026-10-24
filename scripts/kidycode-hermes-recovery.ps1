# KidyCode Hermes crash recovery; Windows PowerShell 5.1+
# Never resets, cleans, merges or publishes. Scope is only kidycode-v2.
[CmdletBinding()]
param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$board = 'kidycode-v2'
$repo = Join-Path $HOME 'kidycode'
$stateRoot = Join-Path $env:LOCALAPPDATA 'KidyCode\hermes-recovery'
$statePath = Join-Path $stateRoot 'state.json'
$logPath = Join-Path $stateRoot 'recovery.log'
New-Item -ItemType Directory -Force -Path $stateRoot | Out-Null
function Log([string]$message) {
  $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $message
  Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
  Write-Output $line
}
function CLI([string[]]$arguments) {
  $result = & hermes @arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Hermes failed: $result" }
  return $result
}
if (-not (Get-Command git -ErrorAction SilentlyContinue) -or -not (Get-Command hermes -ErrorAction SilentlyContinue)) { throw 'Requires git and hermes on PATH.' }
if (-not (Test-Path (Join-Path $repo '.git'))) { throw 'KidyCode repo missing.' }
$remote = ((& git -C $repo remote get-url origin) | Out-String).Trim()
if ($remote -notmatch '(^https://github\.com/|^git@github\.com:)A-Bimu/kidycode(\.git)?$') { throw "Unexpected repository: $remote" }
$mutex = New-Object System.Threading.Mutex($false, 'Local\KidyCodeV2HermesRecovery')
$locked = $false
try {
  $locked = $mutex.WaitOne(0)
  if (-not $locked) { Log 'Another recovery check is active; skipping.'; exit 0 }
  $state = @{ retried = @{} }
  if (Test-Path $statePath) {
    $data = Get-Content $statePath -Raw | ConvertFrom-Json
    if ($data.retried) {
      foreach ($p in $data.retried.PSObject.Properties) { $state.retried[$p.Name] = $p.Value }
    }
  }
  $raw = CLI @('kanban','--board',$board,'list','--json')
  $parsed = $raw | ConvertFrom-Json
  if ($parsed -is [array]) { $tasks = @($parsed) }
  elseif ($parsed.tasks) { $tasks = @($parsed.tasks) }
  elseif ($parsed.items) { $tasks = @($parsed.items) }
  else { throw 'Unrecognized Hermes Kanban JSON task list; no action.' }
  if (@($tasks | Where-Object { $_.status -eq 'running' }).Count -gt 0) {
    Log 'A KidyCode worker is running; no intervention.'
    exit 0
  }
  foreach ($task in $tasks) {
    $id = if ($task.task_id) { [string]$task.task_id } else { [string]$task.id }
    if (-not $id -or $id -notmatch '^t_[a-z0-9]+$') { continue }
    if ($task.status -ne 'blocked') { continue }
    if ($state.retried.ContainsKey($id)) { Log "Already recovered $id once. Leaving blocked for review."; continue }
    $show = CLI @('kanban','--board',$board,'show',$id)
    $runs = CLI @('kanban','--board',$board,'runs',$id)
    # Only a worker death plus exhausted retry is eligible. Human blocks and validation errors are never reset.
    if ($show -notmatch 'gave_up' -or $show -notmatch 'pid .+ not alive' -or $runs -notmatch '(?m)\bcrashed\b') {
      Log "Task $id is blocked without a confirmed worker crash; leaving it untouched."
      continue
    }
    $root = Join-Path $repo ".worktrees\$id"
    if (-not (Test-Path $root) -or -not (Test-Path (Join-Path $root '.git'))) {
      Log "Task $id has no preserved worktree; refusing to retry."
      continue
    }
    $root = (Resolve-Path $root).Path
    $branch = ((& git -C $root branch --show-current) | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne "wt/$id") { Log "Unexpected branch for $id ($branch); refusing."; continue }
    $backup = Join-Path $stateRoot ("snapshot-$id-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    if ($DryRun) {
      Log "DRY RUN: would back up $root to $backup and retry $id once."
      continue
    }
    New-Item -ItemType Directory -Force -Path $backup | Out-Null
    $head = ((& git -C $root rev-parse HEAD) | Out-String).Trim()
    $head | Set-Content -LiteralPath (Join-Path $backup 'head.txt') -Encoding ASCII
    & git -C $root status --porcelain=v1 -uall | Set-Content -LiteralPath (Join-Path $backup 'status.txt') -Encoding UTF8
    if ($LASTEXITCODE -ne 0) { throw 'Could not record git status.' }
    $patch = Join-Path $backup 'tracked-changes.patch'
    & git -C $root diff --binary --no-ext-diff "--output=$patch"
    if ($LASTEXITCODE -ne 0) { throw 'Could not back up tracked changes.' }
    $newFiles = & git -C $root ls-files --others --exclude-standard
    if ($LASTEXITCODE -ne 0) { throw 'Could not enumerate untracked files.' }
    foreach ($relative in @($newFiles)) {
      if (-not $relative) { continue }
      $source = Join-Path $root $relative
      $dest = Join-Path (Join-Path $backup 'untracked') $relative
      $destinationDir = Split-Path -Parent $dest
      New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
      Copy-Item -LiteralPath $source -Destination $dest -Force
    }
    $state.retried[$id] = @{ at = (Get-Date).ToString('o'); backup = $backup; reason = 'worker crashed / gave_up' }
    $state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statePath -Encoding UTF8
    Log "Saved recovery snapshot for $id at $backup."
    # A later manual approval can reset the state, but this watchdog will never keep cycling.
    $unblock = CLI @('kanban','--board',$board,'unblock',$id)
    Log ("Unblocked ${id}: " + $unblock.Trim())
    $dispatch = CLI @('kanban','--board',$board,'dispatch','--max','1')
    Log ("Single dispatch for ${id}: " + $dispatch.Trim())
    exit 0
  }
  Log 'No eligible worker-crash recovery needed.'
} catch {
  Log ("ERROR: " + $_.Exception.Message)
  exit 1
} finally {
  if ($locked) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
