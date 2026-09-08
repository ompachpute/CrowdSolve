# Build and deploy CrowdSolve (PowerShell)
# Usage: .\deploy.ps1 -Environment local|staging|production

param(
    [string]$Environment = "local"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CrowdSolve Deployment" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Load .env
$envVars = @{}
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#]+?)\s*=\s*(.*?)\s*$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }
}

# Step 1: Stop existing containers
Write-Host "[1/5] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans 2>$null
Write-Host ""

# Step 2: Build all services
Write-Host "[2/5] Building all services..." -ForegroundColor Yellow
docker-compose build --no-cache 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Start database first
Write-Host "[3/5] Starting database..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 5
Write-Host ""

# Step 4: Start all services
Write-Host "[4/5] Starting all services..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 10
Write-Host ""

# Step 5: Health check
Write-Host "[5/5] Checking health..." -ForegroundColor Yellow
$retries = 0
$backendPort = $envVars.BACKEND_PORT -or 8080
$aiPort = $envVars.AI_PORT -or 8000
$frontendPort = $envVars.FRONTEND_PORT -or 3000

while ($retries -lt 10) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$backendPort/actuator/health" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) {
            Write-Host "Backend: HEALTHY" -ForegroundColor Green
            break
        }
    } catch {
        $retries++
        Start-Sleep -Seconds 3
    }
}
if ($retries -ge 10) {
    Write-Host "Backend: UNHEALTHY after 10 retries" -ForegroundColor Red
    exit 1
}

try {
    $r = Invoke-WebRequest -Uri "http://localhost:$aiPort/health" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
        Write-Host "AI Service: HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "AI Service: UNHEALTHY" -ForegroundColor Yellow
}

try {
    $r = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
        Write-Host "Frontend: HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend: UNHEALTHY" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend:   http://localhost:$backendPort" -ForegroundColor White
Write-Host "  AI Service: http://localhost:$aiPort" -ForegroundColor White
Write-Host ""