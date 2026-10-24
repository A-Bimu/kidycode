# Install local KidyCode-only recovery task. Does not affect ALIA.
[CmdletBinding()]
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$name = 'KidyCode-Hermes-Recovery'
$root = Join-Path $env:LOCALAPPDATA 'KidyCode\hermes-recovery'
$source = 'https://raw.githubusercontent.com/A-Bimu/kidycode/f808ebcfffbdfeedf99fb45b9ab2cf9f62cffa6f/scripts/kidycode-hermes-recovery.ps1'
$target = Join-Path $root 'kidycode-hermes-recovery.ps1'
if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host 'KidyCode recovery task disabled. Backups and logs were preserved.'
  exit
}
New-Item -ItemType Directory -Force -Path $root | Out-Null
Invoke-WebRequest -Uri $source -OutFile $target -UseBasicParsing -TimeoutSec 30
if (-not (Test-Path $target)) { throw 'Recovery script was not downloaded.' }
$downloaded = Get-Content -LiteralPath $target -Raw
if ($downloaded.Contains('$id: ') -or -not $downloaded.Contains('${id}: ') -or $downloaded.Contains('function CLI(') -or -not $downloaded.Contains('function Invoke-KidycodeHermes(')) { throw 'Downloaded script is stale or contains PowerShell command name conflicts. Refusing installation.' }
# Validate PowerShell syntax before dry-running or installing the task.
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile($target, [ref]$tokens, [ref]$parseErrors) | Out-Null
if ($parseErrors.Count -gt 0) { throw ('Recovery script syntax invalid: ' + (($parseErrors | ForEach-Object { $_.Message }) -join '; ')) }
# Test without making changes before scheduling.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $target -DryRun
if ($LASTEXITCODE -ne 0) { throw 'Recovery dry-run failed. No task installed.' }
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 10) -RepetitionDuration (New-TimeSpan -Days 365)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $target + '"')
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 3) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$account = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'KidyCode V2 crash recovery, once per failed task, with git backup; no ALIA access' -Force | Out-Null
Write-Host ('Installed ' + $name + ' for user ' + $account + '. Runs every 10 minutes while signed in.')
Write-Host ('Log: ' + (Join-Path $root 'recovery.log'))
Write-Host 'If you want to stop it: Unregister-ScheduledTask -TaskName KidyCode-Hermes-Recovery -Confirm:$false'
Write-Warning 'Each auto-retry can incur OpenRouter costs. USD 20 is NOT a hard-enforced cap. No production deployment is performed.'
