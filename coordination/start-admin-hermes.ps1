# KidyCode Admin Console: launch the complete owner-approved task in local Hermes.
# Run from a local checkout of A-Bimu/kidycode with PowerShell.
# This script never bypasses owner authentication, deploys publicly, or spends money.
$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or is not on your PATH."
}
if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) {
  throw "Hermes CLI is not installed or is not on your PATH. Open Hermes Desktop or verify 'hermes' works in PowerShell."
}

$root = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($root)) {
  throw "Open PowerShell inside the local KidyCode git repository before running this script."
}
Set-Location $root
$remote = & git remote get-url origin
if ($remote -notmatch 'A-Bimu[\\/]kidycode(\.git)?$' -and $remote -notmatch 'github\.com[:/]A-Bimu/kidycode(\.git)?$') {
  throw "The current git repository is not A-Bimu/kidycode. Refusing to run Hermes in an unrelated project."
}
$dirty = @(& git status --porcelain)
if ($dirty.Count -gt 0) {
  throw "This working tree has local changes. Commit or stash them before switching to the admin branch."
}

Write-Host "Fetching the current KidyCode admin instructions..." -ForegroundColor Cyan
& git fetch origin
if ($LASTEXITCODE -ne 0) { throw "Git fetch failed." }
& git switch feat/admin-review-console
if ($LASTEXITCODE -ne 0) { throw "Could not switch to feat/admin-review-console." }
& git pull --ff-only origin feat/admin-review-console
if ($LASTEXITCODE -ne 0) { throw "Could not fast-forward admin branch safely." }

$prompt = "coordination/HERMES-ADMIN-DASHBOARD.md"
if (-not (Test-Path -LiteralPath $prompt)) {
  throw "Missing Hermes admin brief: $prompt"
}

Write-Host "Starting Hermes on the Admin Dashboard brief..." -ForegroundColor Magenta
Write-Host "Keep this laptop awake and keep this terminal connected until Hermes finishes its run." -ForegroundColor Yellow
Write-Host "Hermes must not mark finished until safe owner access, true metrics and a working live review URL are verified." -ForegroundColor Yellow
& hermes chat --oneshot --query-file $prompt
if ($LASTEXITCODE -ne 0) {
  throw "Hermes exited with code $LASTEXITCODE. Review its output; do not treat the admin dashboard as complete."
}
Write-Host "Hermes command exited. Review Issue #27 and new PR/CI evidence; exit alone does not mean the dashboard is complete." -ForegroundColor Cyan
