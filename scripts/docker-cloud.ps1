param(
  [Parameter(Position = 0)]
  [ValidateSet('up', 'down', 'logs', 'seed', 'config', 'restart', 'ps', 'pull')]
  [string]$Action = 'up',

  [Parameter()]
  [string]$EnvFile = '.env.cloud',

  [Parameter()]
  [string]$ComposeFile = 'docker-compose.cloud.yml',

  [Parameter()]
  [switch]$Detached,

  [Parameter()]
  [switch]$RemoveVolumes
)

$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Resolve-PathCandidate {
  param([string]$Path)

  if (-not $Path) { return $null }

  if ([System.IO.Path]::IsPathRooted($Path)) {
    if (Test-Path $Path) { return $Path }
    return $null
  }

  $cwdCandidate = Join-Path (Get-Location) $Path
  if (Test-Path $cwdCandidate) { return $cwdCandidate }

  $repoCandidate = Join-Path $repoRoot $Path
  if (Test-Path $repoCandidate) { return $repoCandidate }

  return $null
}

function Invoke-CloudCompose {
  param([string[]]$ComposeArgs)

  $resolvedComposeFile = Resolve-PathCandidate -Path $ComposeFile
  if (-not $resolvedComposeFile) {
    throw "Compose file not found: $ComposeFile. Checked current directory and repo root: $repoRoot"
  }

  $base = @('compose', '-f', $resolvedComposeFile)

  $resolvedEnvFile = Resolve-PathCandidate -Path $EnvFile
  if ($EnvFile -and $resolvedEnvFile) {
    $base += @('--env-file', $resolvedEnvFile)
  }

  $command = @('docker') + $base + $ComposeArgs
  Write-Host ('> ' + ($command -join ' ')) -ForegroundColor Cyan
  & docker @base @ComposeArgs
}

switch ($Action) {
  'up' {
    $args = @('up')
    if ($Detached) { $args += '-d' }
    Invoke-CloudCompose -ComposeArgs $args
    break
  }

  'down' {
    $args = @('down')
    if ($RemoveVolumes) { $args += '-v' }
    Invoke-CloudCompose -ComposeArgs $args
    break
  }

  'logs' {
    Invoke-CloudCompose -ComposeArgs @('logs', '-f')
    break
  }

  'seed' {
    Invoke-CloudCompose -ComposeArgs @('exec', 'api', 'npm', 'run', 'prisma:seed', '-w', 'apps/api')
    break
  }

  'config' {
    Invoke-CloudCompose -ComposeArgs @('config')
    break
  }

  'restart' {
    Invoke-CloudCompose -ComposeArgs @('restart')
    break
  }

  'ps' {
    Invoke-CloudCompose -ComposeArgs @('ps')
    break
  }

  'pull' {
    Invoke-CloudCompose -ComposeArgs @('pull')
    break
  }
}
