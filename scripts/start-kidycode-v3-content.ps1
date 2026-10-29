# KidyCode V3 Hermes launcher. Run once on the Windows computer that hosts Hermes.
# No ALIA/Eureka/KOVU, public deployment, production database changes or existing worktree reset.
[CmdletBinding()]
param([switch]$QueueOnly)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $HOME 'kidycode'
$board = 'kidycode-v3-content'
$base = Join-Path $repo '.worktrees\v3-content-source'
$sourceBranch = 'curriculum/v3-content-only'
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
if ($boards -notmatch [regex]::Escape($board)) {
  Invoke-KidycodeHermes @('kanban','boards','create',$board,'--name','KidyCode V3 Remaining Lessons','--description','Research-led lesson improvement; no production deployment') | Out-Host
}
$raw = Invoke-KidycodeHermes @('kanban','--board',$board,'list','--json')
$parsed = $raw | ConvertFrom-Json
if ($parsed -is [array]) { $items = @($parsed) }
elseif ($parsed.tasks) { $items = @($parsed.tasks) }
elseif ($parsed.items) { $items = @($parsed.items) }
else { throw 'Cannot parse board task list; refusing duplicate task creation.' }
$phases = @(
  @{ title = 'KidyCode remaining V3 - ages 10 to 12'; key = 'kidycode-v3-remain-10-12-20261029'; detail = 'Issue #8. Begin at verified 11/48 scripted lessons in ages-10-12. Add original hooks, worked example, real typed-code change, misconceptions, graduated help and a fresh independent challenge for the remaining lessons; check how many are truly eligible (quiz/project may need distinct presentation). Do not blindly make 48 scripts or pretend all 48 require six moments. Preserve original lesson IDs, Notes and Practice split and continuous project. Run source validator, TypeScript, lint, tests. Commit and report exact coverage, tests and gaps.' },
  @{ title = 'KidyCode remaining V3 - ages 13 to 15'; key = 'kidycode-v3-remain-13-15-20261029'; detail = 'Only after previous task passes. Issue #8. Begin at 13/48 scripted activities for 13-15; fill meaningful unscripted concepts, creative examples and independent transfer, keeping stage and project structure, learning style, accessibility, typed code. Run checks and report exact per-course coverage, commits and incomplete lessons.' },
  @{ title = 'KidyCode remaining V3 - ages 16 to 18'; key = 'kidycode-v3-remain-16-18-20261029'; detail = 'Only after previous task passes. Issue #8. Begin at 10/48 scripted activities for 16-18; develop developer-appropriate concepts incl state, asynchronous failures, code quality, debugging, secure DOM. Preserve independent guidance and actual behaviour checks. Run tests; do not confuse regex mastery with proof of understanding. Report honest coverage.' },
  @{ title = 'KidyCode remaining V3 - adults and cross-course audit'; key = 'kidycode-v3-remain-adults-20261029'; detail = 'Only after previous task passes. Issue #8. Begin at 13/48 for adults; cover remaining practical work/business examples, independent transfer, then run cross-course coverage, all attainable quality gates, responsive/keyboard tests. New lessons must remain original. Open draft review PR ONLY, do not merge/deploy/pilot. Do not modify any auth/security/institution or guardian routes; security issue #9 remains blocked. Stop and report issues rather than weakening tests.' }
)
$parent = $null
$ids = @()
foreach ($phase in $phases) {
  $old = @($items | Where-Object { $_.title -eq $phase.title }) | Select-Object -First 1
  if ($old) {
    $id = if ($old.task_id) { [string]$old.task_id } else { [string]$old.id }
    if (-not $id) { throw ('Task missing ID: ' + $phase.title) }
  } else {
    $instructions = 'ONLY A-Bimu/kidycode. Begin from approved source branch ' + $sourceBranch + ' at ' + $expected + '. Follow docs/v3/remaining-content-execution.md and finish the named batch gate. Work in isolated Git worktree, commit findings; preserve V1/V2 behavior. $20 model-cost allocation is policy not enforced. No ALIA/Eureka/KOVU, child data, production deployments or PR merges. If failing, report blocker and STOP rather than claiming success. ' + $phase.detail
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
  Write-Host 'Dispatching first age-course content batch; this incurs model/API charges.'
  Invoke-KidycodeHermes @('kanban','--board',$board,'dispatch','--max','1') | Out-Host
}
Invoke-KidycodeHermes @('kanban','--board',$board,'list') | Out-Host
Write-Host 'Batches 2 through 4 are dependencies and should not run until predecessor tasks pass. Monitor the board and phase artifacts.'
