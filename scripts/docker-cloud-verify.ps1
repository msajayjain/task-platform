param(
  [Parameter()]
  [string]$EnvFile = '.env.cloud'
)

$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Resolve-EnvPath {
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

function Read-EnvFile {
  param([string]$Path)

  $map = @{}
  $resolvedPath = Resolve-EnvPath -Path $Path
  if (-not $resolvedPath) {
    throw "Env file not found: $Path. Checked current directory and repo root: $repoRoot"
  }

  Get-Content $resolvedPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }

    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }

    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Trim('"')
    }

    $map[$key] = $value
  }

  return $map
}

function Test-Manifest {
  param([string]$ImageRef)

  try {
    & docker manifest inspect $ImageRef *> $null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

$envMap = Read-EnvFile -Path $EnvFile

$user = if ($envMap.ContainsKey('TP_DOCKERHUB_USER') -and $envMap['TP_DOCKERHUB_USER']) { $envMap['TP_DOCKERHUB_USER'] } else { 'ajayjain21' }
$tag = if ($envMap.ContainsKey('TP_APP_VERSION') -and $envMap['TP_APP_VERSION']) { $envMap['TP_APP_VERSION'] } else { 'latest' }

$apiRef = "$user/task-platform-api:$tag"
$webRef = "$user/task-platform-web:$tag"

Write-Host "Checking Docker Hub manifests..." -ForegroundColor Cyan
Write-Host "- API: $apiRef"
Write-Host "- Web: $webRef"

$apiOk = Test-Manifest -ImageRef $apiRef
$webOk = Test-Manifest -ImageRef $webRef

if ($apiOk) {
  Write-Host "[OK] API image tag exists: $apiRef" -ForegroundColor Green
} else {
  Write-Host "[MISSING] API image tag missing: $apiRef" -ForegroundColor Red
}

if ($webOk) {
  Write-Host "[OK] Web image tag exists: $webRef" -ForegroundColor Green
} else {
  Write-Host "[MISSING] Web image tag missing: $webRef" -ForegroundColor Red
}

if ($apiOk -and $webOk) {
  Write-Host "All required Docker Hub image tags are available." -ForegroundColor Green
  exit 0
}

Write-Host "One or more tags are missing. Push images first, then retry." -ForegroundColor Yellow
exit 1
