# Local-development setup for Windows (PowerShell)
# Minimal environment bootstrap — checks dependencies and creates .env from template.
# Mirrors setup.local.sh but skips Docker/Postgres/port allocation (Phase 0 only).
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\setup.local.ps1"
    Write-Host "  Minimal Windows environment bootstrap for Superset."
    Write-Host "  Checks bun/node versions and creates .env from .env.local.example."
    exit 0
}

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path "$ScriptDir\.."

Set-Location $RootDir

Write-Host "=== Superset Windows Environment Bootstrap ===" -ForegroundColor Cyan
Write-Host ""

# --- Dependency Checks ---
Write-Host "[1/3] Checking dependencies..." -ForegroundColor Yellow

$missing = @()

try {
    $bunVersion = bun --version 2>&1
    Write-Host "  bun: $bunVersion" -ForegroundColor Green
} catch {
    $missing += "bun (https://bun.sh)"
    Write-Host "  bun: NOT FOUND" -ForegroundColor Red
}

try {
    $nodeVersion = node --version 2>&1
    Write-Host "  node: $nodeVersion" -ForegroundColor Green
} catch {
    $missing += "node (https://nodejs.org)"
    Write-Host "  node: NOT FOUND" -ForegroundColor Red
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Missing dependencies:" -ForegroundColor Red
    foreach ($dep in $missing) {
        Write-Host "  - $dep" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install the missing dependencies and re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "  All dependencies found." -ForegroundColor Green
Write-Host ""

# --- .env Setup ---
Write-Host "[2/3] Preparing .env..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "  .env already exists — leaving as-is." -ForegroundColor Green
} else {
    if (-not (Test-Path ".env.local.example")) {
        Write-Host "ERROR: .env.local.example not found in $RootDir" -ForegroundColor Red
        exit 1
    }
    Copy-Item ".env.local.example" ".env"
    Write-Host "  Created .env from .env.local.example" -ForegroundColor Green
}

Write-Host ""

# --- Summary ---
Write-Host "[3/3] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review and edit .env with your local configuration"
Write-Host "  2. Run: bun install"
Write-Host "  3. Run: bun run dev"
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
