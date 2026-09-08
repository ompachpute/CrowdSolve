# Build and deploy CrowdSolve
# Usage: deploy.bat [production|staging|local]

@echo off
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=local

echo.
echo ============================================
echo  CrowdSolve Deployment
echo  Environment: %ENVIRONMENT%
echo ============================================
echo.

REM Load environment variables
if exist .env (
    for /f "tokens=1,2 delims==^=^" %%a in (.env) do (
        set "%%a=%%b"
    )
)

REM Step 1: Stop existing containers
echo [1/5] Stopping existing containers...
docker-compose down --remove-orphans 2>nul
echo.

REM Step 2: Build all services
echo [2/5] Building all services...
docker-compose build --no-cache 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    exit /b 1
)
echo.

REM Step 3: Start database first
echo [3/5] Starting database...
docker-compose up -d postgres
timeout /t 5 /nobreak >nul
echo.

REM Step 4: Start all services
echo [4/5] Starting all services...
docker-compose up -d
timeout /t 10 /nobreak >nul
echo.

REM Step 5: Health check
echo [5/5] Checking health...
set /a RETRIES=0
:HEALTH_CHECK
curl -s http://localhost:%BACKEND_PORT%/actuator/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Backend: HEALTHY
) else (
    set /a RETRIES+=1
    if !RETRIES! GEQ 10 (
        echo Backend: UNHEALTHY after 10 retries
        exit /b 1
    )
    timeout /t 3 /nobreak >nul
    goto HEALTH_CHECK
)

curl -s http://localhost:%AI_PORT%/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo AI Service: HEALTHY
) else (
    echo AI Service: UNHEALTHY
)

curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Frontend: HEALTHY
) else (
    echo Frontend: UNHEALTHY
)

echo.
echo ============================================
echo  Deployment Complete!
echo ============================================
echo  Frontend:  http://localhost:%FRONTEND_PORT%
echo  Backend:   http://localhost:%BACKEND_PORT%
echo  AI Service: http://localhost:%AI_PORT%
echo.