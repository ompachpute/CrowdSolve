@echo off
chcp 65001 >nul
echo ==========================================
echo   CrowdSolve Portal - Starting All Services
echo ==========================================
echo.

set PROJECT_ROOT=%~dp0
set DOCKER="C:\Program Files\Docker\Docker\resources\bin\docker.exe"

echo [1/4] Starting PostgreSQL...
cd /d "%PROJECT_ROOT%"
%DOCKER% compose up -d
echo.

echo [2/4] Opening Backend window...
start "CrowdSolve Backend" powershell -NoExit -Command "cd '%PROJECT_ROOT%backend'; mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [3/4] Opening AI Service window...
start "CrowdSolve AI Service" powershell -NoExit -Command "cd '%PROJECT_ROOT%ai-service'; uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

echo [4/4] Opening Frontend window...
start "CrowdSolve Frontend" powershell -NoExit -Command "cd '%PROJECT_ROOT%frontend'; npm start"

echo.
echo ==========================================
echo   All services are starting...
echo ==========================================
echo.
echo   Backend:  http://localhost:8080
echo   AI:       http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo   Demo accounts:
echo     Citizen:    citizen@gmail.com / password
echo     Team:       team@gmail.com / password
echo     Industry:   org@gmail.com / password
echo     Government: gover@gmail.com / password
echo.
echo   Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /FI "WINDOWTITLE eq CrowdSolve Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CrowdSolve AI Service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CrowdSolve Frontend*" /F >nul 2>&1

echo Stopping PostgreSQL...
cd /d "%PROJECT_ROOT%"
%DOCKER% compose down >nul 2>&1

echo.
echo All services stopped.
pause
