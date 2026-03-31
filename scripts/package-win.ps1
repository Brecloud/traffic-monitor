param(
  [string]$SourceDir = "release\win-unpacked",
  [string]$OutputDir = "release"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot $SourceDir
$outputPath = Join-Path $projectRoot $OutputDir

if (-not (Test-Path $sourcePath)) {
  throw "Source directory not found: $sourcePath"
}

if (-not (Test-Path $outputPath)) {
  New-Item -ItemType Directory -Path $outputPath | Out-Null
}

$packageJsonPath = Join-Path $projectRoot "package.json"
$version = (Get-Content -Raw $packageJsonPath | ConvertFrom-Json).version
$zipName = "Traffic-Monitor-v$version-win-x64.zip"
$zipPath = Join-Path $outputPath $zipName

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $sourcePath "*") -DestinationPath $zipPath -CompressionLevel Fastest -Force
Write-Output "ZIP=$zipPath"
