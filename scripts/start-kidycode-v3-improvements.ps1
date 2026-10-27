# KidyCode V3 Hermes launcher. Run once on the Windows computer that hosts Hermes.
# No ALIA/Eureka/KOVU, public deployment, production database changes or existing worktree reset.
[CmdletBinding()]
param([switch]$QueueOnly)
$ErrorActionPreference = 'Stop'
$repo = Join-Path $HOME 'kidycode'
$board = 'kidycode-v3-improvements'
$base = Join-Path $repo '.worktrees\v3-source'
$sourceBranch = 'fix/v3-assessment-correctness'
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
if ($boards -notmatch 'kidycode-v3-improvements') {
  Invoke-KidycodeHermes @('kanban','boards','create',$board,'--name','KidyCode V3 Curriculum and Security Improvements','--description','Research-led lesson improvement; no production deployment') | Out-Host
}
$raw = Invoke-KidycodeHermes @('kanban','--board',$board,'list','--json')
$parsed = $raw | ConvertFrom-Json
if ($parsed -is [array]) { $items = @($parsed) }
elseif ($parsed.tasks) { $items = @($parsed.tasks) }
elseif ($parsed.items) { $items = @($parsed.items) }
else { throw 'Cannot parse board task list; refusing duplicate task creation.' }
$phases = @(
  @{ title = 'KidyCode V3 improve P1 - validate all code assessments'; key = 'kidycode-v3-p1-20261027'; detail = 'Issue #6, draft PR #11. Inspect fixes already committed on this branch. Run regression and ALL check/build/e2e suites. Audit all 192 coding activities for false negatives and regex-only pass bypasses. Where safe, add sandbox/DOM/runtime checks and behavioural tests; do not replace checks with permissive regex. Commit findings/fixes, report remaining exceptions with exact lesson ids.' },
  @{ title = 'KidyCode V3 improve P2 - difficult concepts'; key = 'kidycode-v3-p2-20261027'; detail = 'Issue #7. Only if P1 passed. Extend original visual and typed-code lessons for variables, functions, arrays, loops, Flexbox, Grid and age-appropriate advanced concepts. Misconception-specific hints and actual independent transfer. Keep continuous projects, existing curriculum ids, Notes and Practice separation. Commit incremental batches, run checks.' },
  @{ title = 'KidyCode V3 improve P3 - four age pathways'; key = 'kidycode-v3-p3-20261027'; detail = 'Issue #8. Only if P2 passed. Expand scripted V3 journey across course catalogue in sensible batches with individual coverage report, no fake claims of all 192 if incomplete. Age-appropriate examples/guidance for 10-12, 13-15, 16-18 and adults, responsive/keyboard tested. Validate saved progress and independent mastery. Preserve existing architecture. Commit tested changes.' },
  @{ title = 'KidyCode V3 improve P4 - security review'; key = 'kidycode-v3-p4-20261027'; detail = 'Issue #9 and open security PR #3. Only if P3 passes; IMPORTANT security remains separate review branch and never auto merge. Implement persisted cohort assignments and negative within-organisation tests; check proxy-authenticated identity boundary for spoofing, do not trust client-provided identity headers. Test learner save and transfer replay; responsive keyboard browser checks, no real child data. Stop on unreconciled identity trust problem. Provide security evidence and draft PR.' },
  @{ title = 'KidyCode V3 improve P5 - pilot preparation ONLY'; key = 'kidycode-v3-p5-20261027'; detail = 'Issue #10. Only after P4 passes, prepare consent templates and four learner dry-run scripts with measurable mastery criteria and privacy-safe reporting. DO NOT claim actual human testing, impersonate minors, gather child PII or enable a real pilot without explicit real guardian consent and user release approval. Produce reviewable pilot materials and stop for human testing.' }
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
  Write-Host 'Dispatching P1 assessment audit; this incurs model/API charges.'
  Invoke-KidycodeHermes @('kanban','--board',$board,'dispatch','--max','1') | Out-Host
}
Invoke-KidycodeHermes @('kanban','--board',$board,'list') | Out-Host
Write-Host 'Phases 2 through 5 are dependencies and should not run until predecessor tasks pass. Monitor the board and phase artifacts.'
