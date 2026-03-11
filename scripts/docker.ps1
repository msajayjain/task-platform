param(
  [Parameter(Position = 0)]
  [ValidateSet('up', 'down', 'logs', 'seed', 'config', 'restart', 'ps')]
  [string]$Action = 'up',

  [Parameter()]
  [string]$EnvFile = '',

  [Parameter()]
  [switch]$Detached,

  [Parameter()]
  [switch]$Build,

  [Parameter()]
  [switch]$RemoveVolumes
)

$ErrorActionPreference = 'Stop'

function Invoke-Compose {
  param([string[]]$Args)

  $base = @('compose')
  if ($EnvFile -and (Test-Path $EnvFile)) {
    $base += @('--env-file', $EnvFile)
  }

  $command = @('docker') + $base + $Args
  Write-Host ('> ' + ($command -join ' ')) -ForegroundColor Cyan
  & docker @base @Args
}

switch ($Action) {
  'up' {
    $args = @('up')
    if ($Build) { $args += '--build' }
    if ($Detached) { $args += '-d' }
    if (-not $Build) {
      # default behavior: build images for first-time portability
      $args += '--build'
    }
    Invoke-Compose -Args $args
    break
  }

  'down' {
    $args = @('down')
    if ($RemoveVolumes) { $args += '-v' }
    Invoke-Compose -Args $args
    break
  }

  'logs' {
    Invoke-Compose -Args @('logs', '-f')
    break
  }

  'seed' {
    Invoke-Compose -Args @('exec', 'api', 'npm', 'run', 'prisma:seed', '-w', 'apps/api')
    break
  }

  'config' {
    Invoke-Compose -Args @('config')
    break
  }

  'restart' {
    Invoke-Compose -Args @('restart')
    break
  }

  'ps' {
    Invoke-Compose -Args @('ps')
    break
  }
}
