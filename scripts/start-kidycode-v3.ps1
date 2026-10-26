# KidyCode V3 Hermes launcher. Run once on the Windows computer that hosts Hermes.
# No ALIA/Eureka/KOVU, public deployment, production database changes or existing worktree reset.
[CmdletBinding()]
param([switch]$QueueOnly)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $HOME 'kidycode'
$board = 'kidycode-v3'
$base = Join-Path $repo '.worktrees\v3-source'
$sourceBranch = 'plan/v3-hermes-learning-experience'
function Invoke-KidycodeHermes([string[]]$arguments) {
  $output = & hermes @arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw ('Hermes error: ' + $output) }
  return $output.Trim()
}
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) { throw 'Hermes is not on PATH.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not on PATH.' }
if (-not (Test-Path (Join-Path $repo '.git'))) { throw ('Missing repository: ' + $repo) }
$origin = (& git -C $repo remote get-url origin | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -notmatch '(^https://github\.com/|^git@github\.com:)A-Bimu/kidycode(\.git)?$') { throw ('Unexpected repository origin: ' + $origin) }
& git -C $repo fetch origin $sourceBranch
if ($LASTEXITCODE -ne 0) { throw 'Cannot fetch V3 plan branch.' }
$expected = (& git -C $repo rev-parse ('origin/' + $sourceBranch) | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve V3 source commit.' }
if (-not (Test-Path (Join-Path $base '.git'))) {
  & git -C $repo worktree add --detach $base ('origin/' + $sourceBranch)
  if ($LASTEXITCODE -ne 0) { throw 'Cannot make clean V3 seed worktree.' }
}
$actual = (& git -C $base rev-parse HEAD | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $actual -ne $expected) { throw 'Existing V3 seed worktree is not at the approved source commit; refusing to overwrite it.' }
$dirty = (& git -C $base status --porcelain | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'V3 seed worktree contains changes; refusing to modify.' }
$boards = Invoke-KidycodeHermes @('kanban','boards','list')
if ($boards -notmatch 'kidycode-v3') {
  Invoke-KidycodeHermes @('kanban','boards','create',$board,'--name','KidyCode V3 Learning Experience','--description','Research-led lesson improvement; no production deployment') | Out-Host
}
$raw = Invoke-KidycodeHermes @('kanban','--board',$board,'list','--json')
$parsed = $raw | ConvertFrom-Json
if ($parsed -is [array]) { $items = @($parsed) }
elseif ($parsed.tasks) { $items = @($parsed.tasks) }
elseif ($parsed.items) { $items = @($parsed.items) }
else { throw 'Cannot parse board task list; refusing duplicate task creation.' }
$phases = @(
  @{ title = 'KidyCode V3 P1 - source research and curriculum audit'; key = 'kidycode-v3-phase-1-20261026'; detail = 'Execute Phase 1 only: compare Code Club, Code.org, freeCodeCamp, Scratch and Odin; verify licences and source URLs. Audit all four existing course bundles and top 10 difficult topics. Write docs/v3/research-matrix.md, curriculum-audit.md, lesson-blueprint.md and original scripts for HTML headings, CSS flexbox, JavaScript loops. Commit findings with path-level evidence. DO NOT start coding new UI before artifacts are validated.' },
  @{ title = 'KidyCode V3 P2 - guided lesson experience and sample modules'; key = 'kidycode-v3-phase-2-20261026'; detail = 'Only after Phase 1 success and commit. Implement a reusable, responsive, age-sensitive typed-code lesson journey and 3 complete sample lessons using approved blueprint. Keep Notes and Practice as separate destinations; preserve existing course IDs, progress and assessments. Avoid unrelated institution code. Commit and run focused checks.' },
  @{ title = 'KidyCode V3 P3 - test and draft release candidate'; key = 'kidycode-v3-phase-3-20261026'; detail = 'Only after Phase 2 success. Run npm ci/check/lint/build/test:e2e and supported browser tests; add meaningful hint, mastery and error-recovery checks without weakening existing tests. Write report with evidence and open draft review PR; NO auto merge, prod DB changes, deploy or access to minors. Security PR #3 still blocks child pilot.' }
)
$parent = $null
$ids = @()
foreach ($phase in $phases) {
  $old = @($items | Where-Object { $_.title -eq $phase.title }) | Select-Object -First 1
  if ($old) {
    $id = if ($old.task_id) { [string]$old.task_id } else { [string]$old.id }
    if (-not $id) { throw ('Task missing ID: ' + $phase.title) }
  } else {
    $instructions = 'ONLY A-Bimu/kidycode. Begin from approved source branch ' + $sourceBranch + ' at ' + $expected + '. Follow docs/v3/phase-plan.md and finish the named phase gate. Work in isolated Git worktree, commit findings; preserve V1/V2 behavior. $20 model-cost allocation is policy not enforced. No ALIA/Eureka/KOVU, child data, production deployments or PR merges. If failing, report blocker and STOP rather than claiming success. ' + $phase.detail
    $arguments = @('kanban','--board',$board,'create',$phase.title,'--assignee','default','--body',$instructions,'--workspace',('worktree:' + $base),'--idempotency-key',$phase.key,'--max-runtime','3h','--max-retries','1','--json')
    if ($parent) { $arguments += @('--parent',$parent) }
    $result = Invoke-KidycodeHermes $arguments | ConvertFrom-Json
    $id = if ($result.task_id) { [string]$result.task_id } elseif ($result.id) { [string]$result.id } elseif ($result.task.id) { [string]$result.task.id } else { '' }
    if (-not $id) { throw ('Created task but cannot parse ID: ' + $phase.title) }
  }
  Write-Host ('Queued phase: ' + $phase.title + ' [' + $id + ']')
  $parent = $id
  $ids += $id
}
Invoke-KidycodeHermes @('kanban','--board',$board,'diagnostics') | Out-Host
if (-not $QueueOnly) {
  Write-Host 'Dispatching Phase 1; this incurs model/API charges.'
  Invoke-KidycodeHermes @('kanban','--board',$board,'dispatch','--max','1') | Out-Host
}
Invoke-KidycodeHermes @('kanban','--board',$board,'list') | Out-Host
Write-Host 'Phases 2 and 3 are dependencies and should not run until predecessor tasks pass. Monitor the board and phase artifacts.'
