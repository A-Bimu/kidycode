# KidyCode V2 - Hermes Kanban bootstrap (Windows PowerShell 5.1+)
# Scope: C:\Users\USER\kidycode only. No changes to ALIA, production DB, or live website.
[CmdletBinding()]
param([string]$Repo = (Join-Path $HOME 'kidycode'), [switch]$QueueOnly)
$ErrorActionPreference = 'Stop'
$board = 'kidycode-v2'
function H([string[]]$argv) {
  Write-Host ('> hermes ' + ($argv -join ' ')) -ForegroundColor Cyan
  $lines = & hermes @argv 2>&1
  $code = $LASTEXITCODE
  $out = ($lines | Out-String).Trim()
  if ($code -ne 0) { throw "Hermes exit $code : $out" }
  return $out
}
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) { throw 'Hermes not installed or not on PATH.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git not installed or not on PATH.' }
if (-not (Test-Path (Join-Path $Repo '.git'))) { throw "KidyCode repository not found: $Repo" }
$Repo = (Resolve-Path $Repo).Path
$remote = ((& git -C $Repo remote get-url origin) | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $remote -notmatch '(^https://github\.com/|^git@github\.com:)A-Bimu/kidycode(\.git)?$') { throw "Refusing unexpected repository: $remote" }
$dirty = ((& git -C $Repo status --porcelain) | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $dirty) { throw "Working tree has uncommitted changes. Stop without changes: $dirty" }
Write-Host "Verified local KidyCode repository: $Repo" -ForegroundColor Green
$boards = H @('kanban','boards','list')
if ($boards -notmatch '(?im)\bkidycode-v2\b') {
  H @('kanban','boards','create',$board,'--name','KidyCode V2','--description','72-hour course expansion and release dry-run') | Out-Host
}
$existing = H @('kanban','--board',$board,'list','--json')
$items = @()
try {
  $decoded = $existing | ConvertFrom-Json
  if ($decoded -is [array]) { $items = @($decoded) }
  elseif ($decoded.tasks) { $items = @($decoded.tasks) }
  elseif ($decoded.items) { $items = @($decoded.items) }
} catch { throw 'Cannot parse existing Kanban task inventory; refusing duplicate creation.' }
$phases = @(
  @{ title='KidyCode V2 D1 - foundations and contracts'; key='kidycode-v2-d1-20261023'; desc='Build signed-in LMS accounts, enrolments, learner linking; four transfer project banks/scaffold levels; organisation, cohort, institution role and academic review boundaries. Prove schema generation, additive migration safety, role isolation and project contracts.' },
  @{ title='KidyCode V2 D2 - learner and institution experience'; key='kidycode-v2-d2-20261023'; desc='Build learner dashboard, course catalogue, Notes Library, Practice Lab, standalone UI/UX Design course, Build Outside KidyCode (VS Code, DevTools, files, Git, GitHub and publishing), institution pilot workspace, curriculum map, Skills Evidence Record and pending-approval certificate wording. Verify small screens.' },
  @{ title='KidyCode V2 D3 - dry run and release candidate'; key='kidycode-v2-d3-20261023'; desc='Run simulated failure-to-recovery journeys on four pathways including changed requirements. Verify persistence, one-time transfer refusal, role isolation and certification. Run npm ci/check/lint/build/test:e2e, browser and DB audits. Record logs, findings and commit SHA; PR for human review only, no deployment.' }
)
$parent = $null
$created = @()
foreach ($phase in $phases) {
  $found = @($items | Where-Object { $_.title -eq $phase.title }) | Select-Object -First 1
  if ($found) {
    $id = if ($found.task_id) { [string]$found.task_id } else { [string]$found.id }
    if (-not $id) { throw "Existing card has no task id: $($phase.title)" }
    Write-Host "Existing task: $id" -ForegroundColor Yellow
  } else {
    $body = "ONLY A-Bimu/kidycode ($Repo). Follow docs/72-hour-v2-execution.md. Preserve V1. Work in isolated Git worktree and a feature branch. Do not touch ALIA/Eureka/KOVU, production data, live publishing or children data. No university co-branding without written approval. Budget policy: KidyCode allocation USD 20, not programmatically enforced; avoid runaway paid agent loops. If blocked, record precise evidence and stop. " + $phase.desc
    $args = @('kanban','--board',$board,'create',$phase.title,'--body',$body,'--workspace',"worktree:$Repo",'--branch','kidycode-v2-work','--idempotency-key',$phase.key,'--max-runtime','2h','--max-retries','1','--json')
    if ($parent) { $args += @('--parent',$parent) }
    $raw = H $args
    $parsed = $raw | ConvertFrom-Json
    $id = if ($parsed.task_id) { [string]$parsed.task_id } elseif ($parsed.id) { [string]$parsed.id } elseif ($parsed.task.id) { [string]$parsed.task.id } else { '' }
    if (-not $id) { throw "Task created but ID not parsed. Inspect board before retrying: $raw" }
    Write-Host "Created task: $id" -ForegroundColor Green
  }
  $parent = $id
  $created += $id
}
Write-Host "Phase sequence: $($created -join ' -> ')" -ForegroundColor Green
H @('kanban','--board',$board,'diagnostics') | Out-Host
H @('kanban','--board',$board,'dispatch','--dry-run','--max','1') | Out-Host
if (-not $QueueOnly) {
  try {
    Resolve-DnsName 'openrouter.ai' -ErrorAction Stop | Out-Null
  } catch {
    Write-Warning 'OpenRouter DNS unavailable. Tasks are queued but will NOT dispatch until connectivity is fixed.'
    $QueueOnly = $true
  }
}
if (-not $QueueOnly) {
  Write-Host 'Dispatching first phase. This may incur model/API charges.' -ForegroundColor Yellow
  H @('kanban','--board',$board,'dispatch','--max','1') | Out-Host
} else { Write-Host 'Queue-only mode: no paid worker started.' -ForegroundColor Yellow }
H @('kanban','--board',$board,'list') | Out-Host
Write-Host 'Review task runs with: hermes kanban --board kidycode-v2 runs TASK_ID' -ForegroundColor Green
Write-Host 'No production publishing or ALIA actions performed by this bootstrap.' -ForegroundColor Green
